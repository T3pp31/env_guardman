# Contributing to Env Guardman

Env Guardman への貢献に興味を持っていただきありがとうございます。

## 開発環境のセットアップ

```bash
git clone https://github.com/T3pp31/env_guardman
cd env_guardman
npm install
npm run build
```

VS Code で `F5` を押して Extension Development Host を起動してください。

## 開発コマンド

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

# 型チェック
npm run typecheck
```

## 技術スタック

- TypeScript (strict mode)
- VS Code Extension API
- esbuild
- Vitest
- ESLint + Prettier

## リリース

`v*` タグをプッシュすると GitHub Actions が自動で Marketplace に公開します。

### 事前準備（初回のみ）

1. [Azure DevOps](https://dev.azure.com) で Personal Access Token (PAT) を発行
   - Scopes: **Marketplace → Manage**
2. GitHub リポジトリの **Settings → Secrets and variables → Actions** で `VSCE_PAT` を登録

### バージョンアップ & 公開

```bash
npm version patch          # 0.1.0 → 0.1.1（patch / minor / major を指定）
git push origin master --tags
```

タグのプッシュをトリガーに typecheck → lint → test → `vsce publish` が自動実行されます。
