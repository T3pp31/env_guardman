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

## テストコード生成ルール

### 環境

- **言語**: TypeScript
- **テストフレームワーク**: Vitest

### 必須要件

テストコードを生成する際は、以下の手順と要件を **必ず** 守ること。

#### 手順 1: テスト観点表の作成

実装の前に、**等価分割・境界値分析に基づくテスト観点表**を Markdown 表で作成する。

```markdown
| # | 観点 | 分類 | 入力例 | 期待結果 |
|---|------|------|--------|----------|
| 1 | 正常な KEY=value | 正常系 | `"DB_HOST=localhost"` | `{ key: "DB_HOST", value: "localhost" }` |
| 2 | 空の入力 | 境界値 | `""` | `[]` |
| ...| ... | ... | ... | ... |
```

#### 手順 2: テストケースの網羅

テスト観点表に基づき、以下のカテゴリを **すべて** 網羅する。

1. **正常系** — 主要なシナリオ（代表値による等価分割）
2. **異常系** — バリデーションエラー、例外（失敗系は正常系と **同数以上** 含める）
3. **境界値** — `0`, 最小値, 最大値, `±1`, 空文字列, `null`, `undefined`
4. **不正な型・形式** — 想定外の型、不正なフォーマットの入力
5. **外部依存の失敗** — ファイル読み込みエラー等（該当する場合）
6. **例外種別・エラーメッセージの検証** — throw される例外の型とメッセージを `toThrow` で検証

#### 手順 3: テストコードのフォーマット

各テストケースに **Given / When / Then** 形式のコメントを付ける。

```typescript
it('should parse KEY=value format', () => {
  // Given: 標準的な KEY=value 形式の文字列
  const input = 'DATABASE_URL=postgres://localhost:5432/db';

  // When: パース処理を実行
  const result = parseEnvFile(input);

  // Then: キーと値が正しく抽出される
  expect(result).toHaveLength(1);
  expect(result[0]?.key).toBe('DATABASE_URL');
  expect(result[0]?.value).toBe('postgres://localhost:5432/db');
});
```

#### 手順 4: 不足観点の自己追加

上記カテゴリで不足している観点があれば、自ら追加してからテストコードを実装する。

#### 手順 5: 実行方法の記載

テストファイル末尾にコメントとして以下を記載する。

```typescript
/**
 * 実行コマンド:
 *   npm run test                    # 全テスト実行
 *   npx vitest run src/test/<file>  # 単一ファイル実行
 *
 * カバレッジ取得:
 *   npx vitest run --coverage
 */
```

### 目標

- **分岐網羅 (Branch Coverage): 100%**
- 失敗系テストケース数 >= 正常系テストケース数

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
