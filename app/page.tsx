"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseItemsCsv, type CsvItem } from "@/lib/csv";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "reading" | "saving">("idle");

  const isProcessing = status !== "idle";
  const statusText = useMemo(() => {
    if (status === "reading") return "読み込み中...";
    if (status === "saving") return "保存中...";
    return "";
  }, [status]);

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("CSVファイルを選択してください");
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      toast.error("CSV形式のファイルを選択してください");
      return;
    }

    try {
      setStatus("reading");
      const csvText = await selectedFile.text();
      const items: CsvItem[] = parseItemsCsv(csvText);

      setStatus("saving");
      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "データ保存に失敗しました");
      }

      toast.success(`${items.length}件のデータを保存しました`);
      setSelectedFile(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "アップロード中に不明なエラーが発生しました";
      toast.error(message);
    } finally {
      setStatus("idle");
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
      <h1 className="text-2xl font-semibold text-gray-900">CSVアップロード</h1>
      <p className="mt-2 text-sm text-gray-600">
        ヘッダーが <code>ID,Title,Content</code> のCSVを選択して保存してください。
      </p>

      <div className="mt-8 w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <label htmlFor="csv-file" className="mb-2 block text-sm font-medium text-gray-700">
          CSVファイル
        </label>
        <Input
          id="csv-file"
          type="file"
          accept=".csv"
          disabled={isProcessing}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setSelectedFile(file);
          }}
        />

        <Button
          type="button"
          className="mt-4"
          disabled={!selectedFile || isProcessing}
          onClick={handleUpload}
        >
          データを保存する
        </Button>

        {statusText ? (
          <p className="mt-3 text-sm text-gray-600" role="status" aria-live="polite">
            {statusText}
          </p>
        ) : null}
      </div>
    </main>
  );
}
