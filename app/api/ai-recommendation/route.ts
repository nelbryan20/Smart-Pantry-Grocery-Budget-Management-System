import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const formatDate = (dateString: string | null) => {
  if (!dateString) return "none";

  const date = new Date(dateString);

  return date.toLocaleDateString("en-US");
};

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return Response.json({
        recommendation: "Please login first.",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json({
        recommendation: "Please login first.",
      });
    }

    const { data: membership } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!membership?.household_id) {
      return Response.json({
        recommendation:
          "Create or join a household first to get synced recommendations.",
      });
    }

    const householdId = membership.household_id;

    const { data: pantryItems } = await supabase
      .from("pantry_items")
      .select("item_name, category, quantity, unit, price, expiration_date")
      .eq("household_id", householdId)
      .order("expiration_date", { ascending: true, nullsFirst: false });

    const { data: wasteReports } = await supabase
      .from("waste_reports")
      .select("item_name, category, quantity_wasted, reason, wasted_date")
      .eq("household_id", householdId)
      .order("wasted_date", { ascending: false })
      .limit(10);

    const { data: expenses } = await supabase
      .from("grocery_expenses")
      .select("item_name, category, quantity, unit, price, purchase_date")
      .eq("household_id", householdId)
      .order("purchase_date", { ascending: false })
      .limit(10);

    const { data: budget } = await supabase
      .from("grocery_budgets")
      .select("monthly_budget, current_spend, month, year")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const urgentItems =
      pantryItems?.filter((item: any) => {
        if (!item.expiration_date) return false;

        const expiry = new Date(item.expiration_date);
        expiry.setHours(0, 0, 0, 0);

        const diffDays =
          (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

        return diffDays <= 3;
      }) || [];

    const totalSpend =
      expenses?.reduce((sum: number, item: any) => {
        return sum + Number(item.price || 0);
      }, 0) || 0;

    const pantryCount = pantryItems?.length || 0;

    const wasteCount =
      wasteReports?.reduce((sum: number, item: any) => {
        return sum + Number(item.quantity_wasted || 1);
      }, 0) || 0;

    const focus =
      urgentItems.length > 0
        ? "expiry"
        : wasteCount > 0
        ? "waste"
        : budget && Number(budget.monthly_budget || 0) > 0
        ? "budget"
        : totalSpend > 0
        ? "spending"
        : pantryCount < 3
        ? "restock"
        : "meal";

    const pantrySummary =
      pantryItems?.length
        ? pantryItems
            .map(
              (item: any) =>
                `${item.item_name}, ${item.quantity} ${item.unit}, ${item.category}, ₱${item.price}, expires ${formatDate(item.expiration_date)}`
            )
            .join("\n")
        : "No pantry items.";

    const urgentSummary =
      urgentItems.length > 0
        ? urgentItems
            .map(
              (item: any) =>
                `${item.item_name}, expires ${formatDate(item.expiration_date)}`
            )
            .join("\n")
        : "No urgent items.";

    const wasteSummary =
      wasteReports?.length
        ? wasteReports
            .map(
              (item: any) =>
                `${item.item_name}, wasted because ${item.reason} on ${formatDate(item.wasted_date)}`
            )
            .join("\n")
        : "No waste reports.";

    const expenseSummary =
      expenses?.length
        ? expenses
            .map(
              (item: any) =>
                `${item.item_name}, ₱${item.price}, ${item.category}, purchased ${formatDate(item.purchase_date)}`
            )
            .join("\n")
        : "No expenses.";

    const budgetSummary = budget
      ? `Budget ₱${budget.monthly_budget}, current spend ₱${budget.current_spend}`
      : "No budget.";

    const prompt = `
You are Smart Pantry AI.

Use ONLY actual household data.
Do not invent items.
Return ONLY plain text.
Do not use markdown.
Do not use asterisks.
Do not use bullet points.
Do not use numbering.
Do not use quotation marks.
Maximum 35 words.

Focus mode: ${focus}

Rules:
If focus is expiry, recommend earliest expiring item first.
If focus is waste, mention reducing repeated waste.
If focus is budget, mention budget control.
If focus is spending, mention spending reduction.
If focus is restock, suggest restocking.
If focus is meal, suggest a meal using pantry items.

URGENT:
${urgentSummary}

PANTRY:
${pantrySummary}

WASTE:
${wasteSummary}

EXPENSES:
${expenseSummary}

BUDGET:
${budgetSummary}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 80,
    });

    const rawRecommendation =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Add pantry, budget, expense, or waste data.";

    const cleanedRecommendation = rawRecommendation
      .replace(/\*/g, "")
      .replace(/[-•]/g, "")
      .replace(/^\d+\.\s/g, "")
      .replace(/"/g, "")
      .trim();

    return Response.json({
      recommendation: cleanedRecommendation,
    });
  } catch (error) {
    console.error(error);

    return Response.json({
      recommendation: "AI recommendation unavailable.",
    });
  }
}