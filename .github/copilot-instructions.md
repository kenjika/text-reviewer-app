# Copilot Instructions

このリポジトリは、CSV を Supabase の `items` テーブルへ保存する Next.js アプリです。

## Repository Goals

- 既存の責務分離を保ち、小さく安全な差分で変更する。
- UI はモバイルファーストで実装する。
- CSV の取り込み仕様 `ID,Title,Content` を壊さない。
- Supabase の保存先は `items` テーブルを前提に扱う。

## Working Rules

- まず関連ファイルを読み、既存の実装パターンに合わせる。
- 1 回の変更では 1 つの目的に集中し、不要なリファクタは混ぜない。
- DB や API の仕様を変える場合は、影響範囲と必要な環境変数を明記する。
- エラーメッセージは利用者が対処しやすい日本語を優先する。
- 変更後は最低限 `npm run lint` を想定した実装とし、確認手順を残す。

## Issue And PR Conventions

- Issue には目的、対象ファイル、完了条件を書く。
- 大きな機能は独立して検証できる小さな Issue に分割する。
- PR や変更説明には目的、変更点、確認方法、未対応事項を含める。
