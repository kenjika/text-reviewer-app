import { getSupabaseAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ItemRow = {
  id: string;
  title: string;
  content: string;
};

type ReviewRow = {
  item_id: string;
  is_liked: boolean;
  memo: string | null;
  reviewed_at: string | null;
};

class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

function escapeCsvValue(value: string) {
  const escaped = value.replaceAll('"', '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

function buildCsv(rows: ReviewRow[], items: Map<string, ItemRow>) {
  const headers = ["ID", "Title", "Content", "Liked", "Memo", "ReviewedAt"];
  const lines = [headers.join(",")];

  for (const review of rows) {
    const item = items.get(review.item_id);
    if (!item) continue;

    const line = [
      item.id,
      item.title,
      item.content,
      review.is_liked ? "true" : "false",
      review.memo ?? "",
      review.reviewed_at ?? "",
    ].map((value) => escapeCsvValue(value));

    lines.push(line.join(","));
  }

  return `\uFEFF${lines.join("\n")}`;
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();

    const [itemsResult, reviewsResult] = await Promise.all([
      supabase.from("items").select("id,title,content"),
      supabase
        .from("item_reviews")
        .select("item_id,is_liked,memo,reviewed_at")
        .not("reviewed_at", "is", null)
        .order("reviewed_at", { ascending: true }),
    ]);

    if (itemsResult.error) {
      throw new HttpError(500, `アイテム取得エラー: ${itemsResult.error.message}`);
    }

    // item_reviews table may not exist on a fresh environment.
    if (reviewsResult.error && reviewsResult.error.code !== "42P01") {
      throw new HttpError(500, `レビュー取得エラー: ${reviewsResult.error.message}`);
    }

    const items = new Map<string, ItemRow>();
    for (const item of (itemsResult.data ?? []) as ItemRow[]) {
      items.set(item.id, item);
    }

    const reviews = (reviewsResult.data ?? []) as ReviewRow[];
    const csv = buildCsv(reviews, items);
    const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const filename = `review-results-${date}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof SupabaseConfigError
        ? error.message
        : error instanceof Error
          ? error.message
          : "CSVエクスポート中にエラーが発生しました";
    const status = error instanceof HttpError ? error.status : 500;

    return Response.json({ error: message }, { status });
  }
}
