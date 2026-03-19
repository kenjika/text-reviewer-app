# Agent Guide

## Project Summary

- Next.js App Router ベースのアプリです。
- CSV のヘッダー `ID,Title,Content` を読み取り、Supabase の `items` テーブルへ保存します。
- UI 文言と運用ドキュメントは日本語が基本です。

## Engineering Expectations

- 変更前に関連ファイルを読んで、既存パターンを優先してください。
- 不要な大規模リネームや無関係な整形は避けてください。
- フロントエンドはモバイルファーストで考えてください。
- API では入力検証と利用者向けエラーメッセージを重視してください。
- 仕様変更時は README と確認手順の更新が必要か確認してください。

## Preferred Workflow

1. 目的を明確にする。
2. 影響ファイルを特定する。
3. 小さな差分で実装する。
4. `npm run lint` を想定して破綻がないことを確認する。
5. 変更内容と確認手順を短く共有する。

## Repository Hotspots

- `app/page.tsx`: CSV アップロード UI
- `app/api/items/route.ts`: 保存 API
- `lib/csv.ts`: CSV パース処理
- `README.md`: セットアップと確認手順
