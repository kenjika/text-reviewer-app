"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type ReviewItem = {
  id: string;
  title: string;
  content: string;
  isLiked: boolean;
  memo: string;
  reviewedAt: string | null;
};

export default function ReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [memoDraft, setMemoDraft] = useState("");
  const [likedDraft, setLikedDraft] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const currentItem = items[currentIndex] ?? null;
  const progressText = useMemo(() => {
    if (items.length === 0) return "0 / 0";
    return `${Math.min(currentIndex + 1, items.length)} / ${items.length}`;
  }, [currentIndex, items.length]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/reviews", { cache: "no-store" });
        const body = (await response.json().catch(() => null)) as
          | { items?: ReviewItem[]; error?: string }
          | null;

        if (!response.ok) {
          throw new Error(body?.error ?? "レビュー対象の取得に失敗しました");
        }

        const loaded = body?.items ?? [];
        setItems(loaded);
        setCurrentIndex(0);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!currentItem) {
      setMemoDraft("");
      setLikedDraft(false);
      return;
    }

    setMemoDraft(currentItem.memo);
    setLikedDraft(currentItem.isLiked);
  }, [currentItem]);

  const saveCurrent = async () => {
    if (!currentItem) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: currentItem.id,
          isLiked: likedDraft,
          memo: memoDraft,
        }),
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(body?.error ?? "レビュー保存に失敗しました");
      }

      setItems((prev) =>
        prev.map((item, index) =>
          index === currentIndex
            ? { ...item, isLiked: likedDraft, memo: memoDraft, reviewedAt: new Date().toISOString() }
            : item,
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (!currentItem) return;

    try {
      await saveCurrent();

      if (currentIndex >= items.length - 1) {
        toast.success("すべてのカードの評価を保存しました");
        return;
      }

      setCurrentIndex((index) => index + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存中にエラーが発生しました");
    }
  };

  const handleExport = async () => {
    try {
      if (currentItem) {
        await saveCurrent();
      }

      setIsExporting(true);
      const response = await fetch("/api/reviews/export");
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "CSVエクスポートに失敗しました");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const matched = contentDisposition?.match(/filename="(.+)"/);
      const filename = matched?.[1] ?? "review-results.csv";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success("CSVをダウンロードしました");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "CSVエクスポート中にエラーが発生しました",
      );
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-8">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </main>
    );
  }

  if (!currentItem) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-8">
        <h1 className="text-xl font-semibold">レビュー</h1>
        <p className="mt-4 text-sm text-muted-foreground">レビュー対象のデータがありません。</p>
        <Link href="/" className="mt-6 text-sm text-primary underline underline-offset-4">
          CSVアップロード画面へ戻る
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">レビュー</h1>
        <span className="text-xs text-muted-foreground">{progressText}</span>
      </header>

      <section className="flex-1 rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">ID: {currentItem.id}</p>
        <h2 className="mt-2 text-lg font-semibold text-card-foreground">{currentItem.title}</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-card-foreground">
          {currentItem.content}
        </p>

        <label htmlFor="memo" className="mt-5 block text-sm font-medium">
          メモ
        </label>
        <textarea
          id="memo"
          className="mt-2 h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          placeholder="気づいた点を入力"
          value={memoDraft}
          onChange={(event) => setMemoDraft(event.target.value)}
          disabled={isSaving}
        />
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant={likedDraft ? "default" : "outline"}
          onClick={() => setLikedDraft((prev) => !prev)}
          disabled={isSaving || isExporting}
        >
          {likedDraft ? "いいね済み" : "いいね"}
        </Button>
        <Button type="button" onClick={handleNext} disabled={isSaving || isExporting}>
          {isSaving ? "保存中..." : "ネクスト"}
        </Button>
      </div>

      <Button
        type="button"
        variant="secondary"
        className="mt-3"
        onClick={handleExport}
        disabled={isSaving || isExporting}
      >
        {isExporting ? "エクスポート中..." : "CSVをダウンロード"}
      </Button>

      <Link href="/" className="mt-4 text-center text-sm text-primary underline underline-offset-4">
        CSVアップロード画面へ戻る
      </Link>
    </main>
  );
}
