# text-reviewer-app

CSV（`ID,Title,Content`）をアップロードし、Supabase の `items` テーブルへ一括保存する Next.js アプリです。

## 必須環境変数

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 開発

```bash
npm install
npm run dev
```

## 確認手順

1. `npm run dev` を実行
2. ブラウザで `/` を開く
3. ヘッダーが `ID,Title,Content` のCSVを選択
4. 「データを保存する」を押して、Toastの成功/失敗表示を確認
