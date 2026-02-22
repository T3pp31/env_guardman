# Env Guardman — プロジェクトガイド

## プロジェクト概要

`.env.example` と `.env` の差分を自動検出し、不足する環境変数をユーザーに通知・入力補助する VS Code 拡張機能。
すべての処理はローカルで完結し、秘匿情報を外部に送信しない。

## 技術スタック

- **言語**: TypeScript (strict mode)
- **ランタイム**: VS Code Extension API
- **バンドラー**: esbuild
- **テスト**: Vitest
- **リンター**: ESLint (flat config)
- **フォーマッター**: Prettier
- **パッケージマネージャ**: npm
- **最低対応 VS Code**: 1.85.0

## ディレクトリ構成

```
env_guardman/
├── .claude/
│   ├── CLAUDE.md              # このファイル
│   └── rules/
│       └── CODE.md            # コード規約
├── .vscode/
│   ├── launch.json            # デバッグ設定
│   └── settings.json          # ワークスペース設定
├── docs/
│   └── requirements.md        # 要件定義書
├── src/
│   ├── extension.ts           # エントリポイント (activate / deactivate)
│   ├── checker/
│   │   ├── envParser.ts       # .env ファイルのパースロジック
│   │   ├── diffChecker.ts     # テンプレートと実ファイルの差分検出
│   │   └── types.ts           # 型定義
│   ├── ui/
│   │   ├── notification.ts    # 通知・ポップアップ表示
│   │   ├── inputWizard.ts     # 対話的入力フロー
│   │   └── statusBar.ts       # ステータスバー表示
│   ├── watcher/
│   │   ├── fileWatcher.ts     # ファイル保存監視
│   │   └── gitWatcher.ts      # ブランチ切り替え監視
│   └── config/
│       └── settings.ts        # 拡張機能設定の読み込み
├── src/test/
│   ├── envParser.test.ts      # パーサーのユニットテスト
│   └── diffChecker.test.ts    # 差分チェックのユニットテスト
├── package.json               # 拡張機能マニフェスト
├── tsconfig.json
├── eslint.config.mjs
├── .prettierrc
├── esbuild.mjs                # ビルドスクリプト
├── .gitignore
├── .vscodeignore
├── LICENSE
└── README.md
```

## 主要コマンド

```bash
# 依存インストール
npm install

# ビルド
npm run build

# 開発ビルド (watch)
npm run watch

# テスト
npm run test

# リント
npm run lint

# フォーマット
npm run format
```

## 開発の原則

### セキュリティ最優先
- **ネットワーク通信は絶対に行わない** — `http`, `https`, `fetch`, `XMLHttpRequest` の使用禁止
- **テレメトリ送信禁止** — `.env` の内容をログやテレメトリに含めない
- **不要な権限を要求しない** — `package.json` の capabilities は最小限に

### ローカル完結
- 外部 API、外部サーバー、クラウドサービスへの依存は一切認めない
- npm パッケージの追加は必要最小限にし、ネットワーク通信を行うパッケージは導入禁止

### テスト必須
- ビジネスロジック (`checker/` 配下) には必ずユニットテストを書く
- テストは `npm run test` で実行可能であること
- 新機能追加時はテストも同時に追加する

## Git ルール

- ブランチ: `claude/env-variable-checker-dbQ8i` で開発
- コミットメッセージ: [Conventional Commits](https://www.conventionalcommits.org/) に従う
  - `feat:` 新機能
  - `fix:` バグ修正
  - `docs:` ドキュメントのみ
  - `refactor:` リファクタリング
  - `test:` テストの追加・修正
  - `chore:` ビルド・設定等
- `.env` ファイルや秘匿情報を絶対にコミットしない
