# Env Guardman

`.env.example` と `.env` の差分を自動検出し、不足する環境変数をユーザーに通知・入力補助する VS Code 拡張機能。

すべての処理はローカルで完結し、秘匿情報を外部に送信しません。

## 解決する課題

チーム開発で誰かが `.env.example` に新しい環境変数を追加したのに気づかず、手元のローカル環境でアプリを起動して謎のエラーで時間を溶かす「あるある」を防ぎます。

## 機能

- **自動差分チェック** — ワークスペース起動時、ブランチ切り替え時、ファイル保存時に `.env.example` と `.env` を自動比較
- **警告通知** — 不足変数がある場合、右下に警告ポップアップを表示
- **対話的入力** — 「今すぐ値を入力する」ボタンから、不足変数を1つずつ InputBox で入力し `.env` に追記
- **ステータスバー** — `.env OK` / `.env: N missing` を常時表示
- **コマンドパレット** — 手動でチェック実行・不足変数の追加が可能
- **完全ローカル** — ネットワーク通信は一切行わず、秘匿情報は安全

## 使い方

1. `.env.example` を含むプロジェクトを VS Code で開く
2. 自動で差分チェックが実行される
3. 不足変数があれば警告通知が表示される
4. 「Add Now」をクリックして値を入力

### コマンド

| コマンド | 説明 |
|----------|------|
| `Env Guardman: Check Missing Variables` | 手動で差分チェックを実行 |
| `Env Guardman: Add Missing Variables` | 不足変数の入力ウィザードを起動 |

## 設定

VS Code の設定 (`settings.json`) で以下のオプションをカスタマイズできます。

| 設定キー | 型 | デフォルト | 説明 |
|----------|-----|-----------|------|
| `envGuardman.templateFile` | `string` | `.env.example` | テンプレートファイルのパス (ワークスペースルートからの相対パス) |
| `envGuardman.envFile` | `string` | `.env` | チェック対象の .env ファイルパス |
| `envGuardman.ignorePatterns` | `string[]` | `[]` | 無視する変数名の正規表現パターン |
| `envGuardman.checkOnOpen` | `boolean` | `true` | ワークスペース起動時の自動チェック |
| `envGuardman.checkOnBranchSwitch` | `boolean` | `true` | ブランチ切り替え時の自動チェック |
| `envGuardman.checkOnSave` | `boolean` | `true` | ファイル保存時の自動チェック |

### 設定例

```jsonc
{
  // OPTIONAL_ で始まる変数を無視
  "envGuardman.ignorePatterns": ["^OPTIONAL_"],
  // ブランチ切り替え時のチェックを無効化
  "envGuardman.checkOnBranchSwitch": false
}
```

## 対応する .env フォーマット

```bash
# コメント行 (無視される)
KEY=value
EMPTY_KEY=
KEY_ONLY
QUOTED="hello world"
SINGLE_QUOTED='hello world'
INLINE_COMMENT=value # コメントは除去される
URL=postgres://host:5432/db?opt=1  # 値の中の = は保持される
```

## プライバシーとセキュリティ

- ネットワーク通信は一切行いません
- `.env` の値はログやテレメトリに含まれません
- すべての処理は VS Code 内でローカルに完結します

## コントリビュート

バグ報告や機能提案は [GitHub Issues](https://github.com/T3pp31/env_guardman/issues) へお願いします。

開発に参加する場合は [CONTRIBUTING.md](https://github.com/T3pp31/env_guardman/blob/master/CONTRIBUTING.md) を参照してください。

## ライセンス

MIT
