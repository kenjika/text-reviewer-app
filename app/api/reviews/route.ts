import { NextResponse } from "next/server";

import { getSupabaseAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ReviewPayload = {
  itemId: string;
  isLiked: boolean;
  memo: string;
};

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

function validateReviewBody(input: unknown): ReviewPayload {
  if (!input || typeof input !== "object") {
    throw new HttpError(400, "送信データ形式が不正です");
  }

  const body = input as Partial<ReviewPayload>;

  if (!body.itemId || typeof body.itemId !== "string") {
    throw new HttpError(400, "itemId は必須です");
  }

  if (typeof body.isLiked !== "boolean") {
    throw new HttpError(400, "isLiked は true または false を指定してください");
  }

  if (typeof body.memo !== "string") {
    throw new HttpError(400, "memo は文字列で指定してください");
  }

  return {
    itemId: body.itemId.trim(),
    isLiked: body.isLiked,
    memo: body.memo.trim(),
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();

    const [itemsResult, reviewsResult] = await Promise.all([
      supabase.from("items").select("id,title,content").order("id", { ascending: true }),
      supabase
        .from("item_reviews")
        .select("item_id,is_liked,memo,reviewed_at")
        .order("reviewed_at", { ascending: false }),
    ]);

    if (itemsResult.error) {
      throw new HttpError(500, `アイテム取得エラー: ${itemsResult.error.message}`);
    }

    // item_reviews table may not exist yet on a fresh environment.
    if (reviewsResult.error && reviewsResult.error.code !== "42P01") {
      throw new HttpError(500, `レビュー取得エラー: ${reviewsResult.error.message}`);
    }

    const reviews = (reviewsResult.data ?? []) as ReviewRow[];
    const items = (itemsResult.data ?? []) as ItemRow[];

    const reviewMap = new Map<string, ReviewRow>();
    for (const review of reviews) {
      if (!reviewMap.has(review.item_id)) {
        reviewMap.set(review.item_id, review);
      }
    }

    const merged = items.map((item) => {
      const review = reviewMap.get(item.id);
      return {
        id: item.id,
        title: item.title,
        content: item.content,
        isLiked: review?.is_liked ?? false,
        memo: review?.memo ?? "",
        reviewedAt: review?.reviewed_at ?? null,
      };
    });

    return NextResponse.json({ items: merged });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const message =
      error instanceof Error ? error.message : "レビュー一覧の取得中にエラーが発生しました";
    const status = error instanceof HttpError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const review = validateReviewBody(body);
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase.from("item_reviews").upsert(
      {
        item_id: review.itemId,
        is_liked: review.isLiked,
        memo: review.memo,
        reviewed_at: new Date().toISOString(),
      },
      { onConflict: "item_id" },
    );

    if (error) {
      throw new HttpError(500, `レビュー保存エラー: ${error.message}`);
    }

    return NextResponse.json({ saved: true });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const message =
      error instanceof Error ? error.message : "レビュー保存中にエラーが発生しました";
    const status = error instanceof HttpError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
