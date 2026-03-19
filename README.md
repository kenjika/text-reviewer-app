# text-reviewer-app

CSV（`ID,Title,Content`）をアップロードし、Supabase の `items` テーブルへ一括保存する Next.js アプリです。  
構成は Next.js + Tailwind CSS + shadcn/ui を前提にしています。

## Node.js 前提

- 実行ランタイム: Node.js
- 推奨バージョン: `20.9.0` 以上（`package.json` の `engines.node`）
- `.nvmrc` を使う場合:

```bash
nvm use
```

## 必須環境変数

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

`.env.local` は `.env.example` をコピーして作成してください。

```bash
cp .env.example .env.local
```

## Supabase 初期設定

`items` テーブルが未作成の場合、以下を実行してください。

```sql
create table if not exists public.items (
  id text primary key,
  title text not null,
  content text not null
);
```

## 開発

```bash
npm install
npm run dev
```

## 本番相当の起動確認

```bash
npm run build
npm run start
```

## 確認手順

1. `npm run dev` を実行
2. ブラウザで `/` を開く
3. ヘッダーが `ID,Title,Content` のCSVを選択
4. 「データを保存する」を押して、Toastの成功/失敗表示を確認

## Node.js実行の検証手順

1. `node -v` で `v20.9.0` 以上を確認
2. `npm install` を実行
3. `npm run build` を実行
4. `npm run start` 実行後に `http://localhost:3000` へアクセス
