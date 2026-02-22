# コード規約 — Env Guardman

## 1. TypeScript 基本規約

### 1.1 厳格モード

`tsconfig.json` で以下を有効にする。

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": false
  }
}
```

### 1.2 型付け

- **`any` の使用は禁止**。やむを得ない場合は `unknown` を使い、型ガードで絞り込む
- 関数の引数と戻り値には必ず型を明示する（ローカル変数は推論に任せてよい）
- VS Code API の型は `@types/vscode` から import する
- 型定義は `src/checker/types.ts` に集約する

```typescript
// Good
function parseEnvLine(line: string): EnvEntry | null {
  // ...
}

// Bad
function parseEnvLine(line: any) {
  // ...
}
```

### 1.3 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| ファイル名 | camelCase | `envParser.ts`, `diffChecker.ts` |
| クラス | PascalCase | `EnvParser`, `DiffChecker` |
| インターフェース / 型エイリアス | PascalCase | `EnvEntry`, `CheckResult` |
| 関数 / メソッド | camelCase | `parseEnvFile()`, `getMissingKeys()` |
| 定数 | UPPER_SNAKE_CASE | `DEFAULT_TEMPLATE_FILE`, `MAX_DEBOUNCE_MS` |
| 変数 | camelCase | `missingKeys`, `templatePath` |
| private メンバー | `_` プレフィックスなし | ESLint で `#private` を推奨 |
| コマンド ID | ドット区切り | `envGuardman.check` |
| 設定キー | ドット区切り camelCase | `envGuardman.templateFile` |

### 1.4 import ルール

- `import type` を型のみの import に使う
- import の並び順（ESLint `import/order` で強制）:
  1. Node.js 標準モジュール (`node:path`, `node:fs`)
  2. VS Code API (`vscode`)
  3. 外部パッケージ
  4. プロジェクト内モジュール（相対パス）
- 各グループ間に空行を入れる

```typescript
import * as path from 'node:path';

import * as vscode from 'vscode';

import type { EnvEntry, CheckResult } from '../checker/types';
import { parseEnvFile } from '../checker/envParser';
```

## 2. モジュール設計規約

### 2.1 関心の分離

各ディレクトリの責務を厳格に守る。

| ディレクトリ | 責務 | 依存してよいもの |
|-------------|------|----------------|
| `checker/` | .env パースと差分検出のビジネスロジック | Node.js 標準ライブラリのみ。**vscode API 禁止** |
| `ui/` | VS Code の UI 操作（通知、InputBox、ステータスバー） | `vscode` API, `checker/types` |
| `watcher/` | ファイル・Git 監視とイベント発火 | `vscode` API |
| `config/` | 拡張機能設定の読み込みと型付け | `vscode` API |
| `extension.ts` | 各モジュールの初期化と接続 | すべてのモジュール |

**重要**: `checker/` は VS Code API に依存しない純粋なロジック層とする。これによりユニットテストを VS Code なしで実行できる。

### 2.2 エクスポート

- 各モジュールは明確なパブリック API のみを export する
- `default export` は使わず、常に `named export` を使う

```typescript
// Good
export function parseEnvFile(content: string): EnvEntry[] { ... }

// Bad
export default function parseEnvFile(content: string): EnvEntry[] { ... }
```

### 2.3 Disposable パターン

VS Code の拡張機能ライフサイクルに合わせ、リソースは必ず `Disposable` として管理する。

```typescript
export function activate(context: vscode.ExtensionContext): void {
  const watcher = vscode.workspace.createFileSystemWatcher('**/.env.example');
  context.subscriptions.push(watcher);
}
```

## 3. 型定義 (`src/checker/types.ts`)

中核となるインターフェースを定義する。

```typescript
/** .env ファイル内の1エントリ */
export interface EnvEntry {
  /** 変数名 (例: "DATABASE_URL") */
  key: string;
  /** 値 (例: "postgres://...") — 空文字列は値なしを意味する */
  value: string;
  /** 直前のコメント行 (説明文として利用) */
  comment?: string;
  /** 元ファイル内の行番号 (1-indexed) */
  line: number;
}

/** 差分チェックの結果 */
export interface CheckResult {
  /** 不足している変数の一覧 */
  missing: EnvEntry[];
  /** チェック対象のテンプレートファイルパス */
  templatePath: string;
  /** チェック対象の .env ファイルパス */
  envPath: string;
}
```

## 4. エラーハンドリング規約

### 4.1 基本方針

- ファイルが存在しない場合は適切にフォールバックする（クラッシュさせない）
- `.env` が存在しない → 全キーが不足として扱う
- `.env.example` が存在しない → チェックをスキップする（静かに終了）

### 4.2 ログ

- `console.log` は使わず、`vscode.window.createOutputChannel` で専用チャネルに出力する
- チャネル名: `Env Guardman`
- `.env` ファイルの**値**をログに含めない（キー名は可）

```typescript
// Good
outputChannel.appendLine(`Missing key: ${entry.key}`);

// Bad — 値を出力してはならない
outputChannel.appendLine(`Missing: ${entry.key}=${entry.value}`);
```

## 5. テスト規約

### 5.1 テストファイル

- テストは `src/test/` に配置する
- テストファイル名は `<対象モジュール>.test.ts` とする
- `checker/` 配下のロジックは Vitest で VS Code なしにテスト可能にする

### 5.2 テスト構造

```typescript
import { describe, it, expect } from 'vitest';
import { parseEnvFile } from '../checker/envParser';

describe('parseEnvFile', () => {
  it('should parse KEY=value format', () => {
    const result = parseEnvFile('DATABASE_URL=postgres://localhost:5432/db');
    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe('DATABASE_URL');
    expect(result[0]?.value).toBe('postgres://localhost:5432/db');
  });

  it('should ignore comment lines', () => {
    const result = parseEnvFile('# This is a comment\nKEY=value');
    expect(result).toHaveLength(1);
  });

  it('should handle empty values', () => {
    const result = parseEnvFile('EMPTY_KEY=');
    expect(result[0]?.value).toBe('');
  });
});
```

### 5.3 テストカバレッジ

- `checker/envParser.ts` と `checker/diffChecker.ts` はカバレッジ 80% 以上を目標とする
- エッジケース（空ファイル、引用符、マルチバイト文字、Windows 改行）をテストに含める

## 6. フォーマット規約 (Prettier)

```jsonc
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf",
  "arrowParens": "always"
}
```

## 7. コメント規約

- JSDoc は **export される関数・クラス・インターフェース** にのみ記述する
- 内部実装の説明は「なぜそうしたか (why)」を書き、「何をしているか (what)」は書かない
- TODO コメントは `// TODO(#issue番号): 説明` の形式とする
- 日本語コメント可（ドキュメント類は日本語、JSDoc は英語推奨）

## 8. package.json のコマンド・設定定義規約

### 8.1 コマンド

```jsonc
"contributes": {
  "commands": [
    {
      "command": "envGuardman.check",
      "title": "Env Guardman: Check Missing Variables"
    },
    {
      "command": "envGuardman.addMissing",
      "title": "Env Guardman: Add Missing Variables"
    }
  ]
}
```

### 8.2 設定

設定キーは `envGuardman.` プレフィックスで統一し、`package.json` の `contributes.configuration` に定義する。

```jsonc
"contributes": {
  "configuration": {
    "title": "Env Guardman",
    "properties": {
      "envGuardman.templateFile": {
        "type": "string",
        "default": ".env.example",
        "description": "Path to the template env file (relative to workspace root)"
      },
      "envGuardman.envFile": {
        "type": "string",
        "default": ".env",
        "description": "Path to the actual env file (relative to workspace root)"
      },
      "envGuardman.ignorePatterns": {
        "type": "array",
        "items": { "type": "string" },
        "default": [],
        "description": "Regex patterns for variable names to ignore"
      },
      "envGuardman.checkOnOpen": {
        "type": "boolean",
        "default": true,
        "description": "Run check when workspace is opened"
      },
      "envGuardman.checkOnBranchSwitch": {
        "type": "boolean",
        "default": true,
        "description": "Run check when Git branch is switched"
      },
      "envGuardman.checkOnSave": {
        "type": "boolean",
        "default": true,
        "description": "Run check when .env or .env.example is saved"
      }
    }
  }
}
```

## 9. セキュリティチェックリスト

コードレビュー時に以下を確認する。

- [ ] `http`, `https`, `fetch`, `XMLHttpRequest`, `net`, `dgram` の使用がないこと
- [ ] `.env` の値をログ・テレメトリ・エラーメッセージに含めていないこと
- [ ] ユーザー入力（InputBox 等）をサニタイズなしでファイルに書き込んでいないこと
- [ ] `package.json` に不要な `permissions` / `capabilities` がないこと
- [ ] 外部へのネットワーク通信を行う npm パッケージが追加されていないこと
