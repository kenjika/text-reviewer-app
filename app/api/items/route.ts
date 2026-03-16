import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type ItemPayload = {
  id: string;
  title: string;
  content: string;
};

const BATCH_SIZE = 500;

class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new HttpError(
      500,
      "Supabaseの環境変数 (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) が設定されていません",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function validateItems(items: unknown): ItemPayload[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, "保存するデータがありません");
  }

  return items.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new HttpError(400, `${index + 1}件目のデータ形式が不正です`);
    }

    const typedItem = item as Partial<ItemPayload>;

    if (!typedItem.id || !typedItem.title || !typedItem.content) {
      throw new HttpError(400, `${index + 1}件目に必須項目の不足があります`);
    }

    return {
      id: typedItem.id,
      title: typedItem.title,
      content: typedItem.content,
    };
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { items?: unknown };
    const items = validateItems(body.items);
    const supabase = getSupabaseAdminClient();

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from("items")
        .upsert(batch, { onConflict: "id" });

      if (error) {
        throw new HttpError(500, `Supabase保存エラー: ${error.message}`);
      }
    }

    return NextResponse.json({ inserted: items.length });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "保存処理中に不明なエラーが発生しました";
    const status = error instanceof HttpError ? error.status : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
