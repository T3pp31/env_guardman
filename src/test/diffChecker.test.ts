/**
 * テスト観点表 — findMissingKeys
 *
 * | #  | 観点                                  | 分類             | 入力例                                      | 期待結果                              |
 * |----|---------------------------------------|------------------|---------------------------------------------|---------------------------------------|
 * | 1  | テンプレートにありenvにないキー        | 正常系           | template: [A,B,C], env: [A]                 | missing: [B,C]                        |
 * | 2  | 差分なし（全キーがenvに存在）         | 正常系           | template: [A,B], env: [A,B]                 | missing: []                           |
 * | 3  | envが空（全キー不足）                  | 正常系           | template: [A,B], env: []                    | missing: [A,B]                        |
 * | 4  | テンプレートもenvも空                  | 境界値           | template: [], env: []                       | missing: []                           |
 * | 5  | テンプレートが空                       | 境界値           | template: [], env: [A]                      | missing: []                           |
 * | 6  | envに余分なキーがある                  | 正常系           | template: [A], env: [A,B]                   | missing: []                           |
 * | 7  | ignorePatterns で除外                  | 正常系           | template: [A, OPTIONAL_X], ignore: [^OPT]  | missing: [A]? or exclude A too?       |
 * | 8  | ignorePatterns に正規表現を使用        | 正常系           | template: [TEST_A], ignore: [^TEST_]        | missing: []                           |
 * | 9  | 無効な正規表現パターン                 | 異常系           | ignore: ["[invalid"]                        | 無効パターンはスキップ、他は正常動作   |
 * | 10 | ignorePatterns が undefined             | 境界値           | ignore: undefined                           | 通常通り動作                           |
 * | 11 | ignorePatterns が空配列                | 境界値           | ignore: []                                  | 通常通り動作                           |
 * | 12 | 1要素のテンプレート、envに存在         | 境界値           | template: [A], env: [A]                     | missing: []                           |
 * | 13 | 1要素のテンプレート、envに不在         | 境界値           | template: [A], env: []                      | missing: [A]                          |
 * | 14 | 返却されるEnvEntryの内容が正しい       | 正常系           | template entries with comment, line         | missing entries preserve all fields   |
 */

import { describe, it, expect } from 'vitest';

import type { EnvEntry } from '../checker/types';
import { findMissingKeys } from '../checker/diffChecker';

/** ヘルパー: 簡易 EnvEntry 生成 */
function entry(key: string, value = '', line = 1, comment?: string): EnvEntry {
  const e: EnvEntry = { key, value, line };
  if (comment !== undefined) {
    e.comment = comment;
  }
  return e;
}

describe('findMissingKeys', () => {
  // ──────────────────────────────
  // 正常系
  // ──────────────────────────────

  it('should return missing keys that exist in template but not in env', () => {
    // Given: テンプレートに A,B,C、envに A のみ
    const template = [entry('A'), entry('B', '', 2), entry('C', '', 3)];
    const env = [entry('A')];

    // When: 差分チェックを実行
    const result = findMissingKeys(template, env);

    // Then: B, C が不足として返される
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.key)).toEqual(['B', 'C']);
  });

  it('should return empty array when all template keys exist in env', () => {
    // Given: テンプレートと env に同じキー
    const template = [entry('A'), entry('B')];
    const env = [entry('A'), entry('B')];

    // When: 差分チェックを実行
    const result = findMissingKeys(template, env);

    // Then: 不足なし
    expect(result).toHaveLength(0);
  });

  it('should return all template keys when env is empty', () => {
    // Given: テンプレートに A,B、env は空
    const template = [entry('A'), entry('B')];
    const env: EnvEntry[] = [];

    // When: 差分チェックを実行
    const result = findMissingKeys(template, env);

    // Then: テンプレートの全キーが不足
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.key)).toEqual(['A', 'B']);
  });

  it('should return empty when env has extra keys beyond template', () => {
    // Given: envにテンプレート以上のキーがある
    const template = [entry('A')];
    const env = [entry('A'), entry('B')];

    // When: 差分チェックを実行
    const result = findMissingKeys(template, env);

    // Then: 不足なし
    expect(result).toHaveLength(0);
  });

  it('should exclude keys matching ignorePatterns', () => {
    // Given: OPTIONAL_ で始まるキーを無視する設定
    const template = [entry('DB_HOST'), entry('OPTIONAL_KEY', '', 2)];
    const env: EnvEntry[] = [];

    // When: ignorePatterns を指定して差分チェック
    const result = findMissingKeys(template, env, ['^OPTIONAL_']);

    // Then: DB_HOST のみが不足（OPTIONAL_KEY は無視）
    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe('DB_HOST');
  });

  it('should support regex in ignorePatterns', () => {
    // Given: 正規表現パターンで TEST_ で始まるキーを無視
    const template = [entry('TEST_A'), entry('TEST_B', '', 2), entry('PROD_C', '', 3)];
    const env: EnvEntry[] = [];

    // When: ^TEST_ パターンで差分チェック
    const result = findMissingKeys(template, env, ['^TEST_']);

    // Then: PROD_C のみが不足
    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe('PROD_C');
  });

  it('should preserve all fields of returned EnvEntry', () => {
    // Given: comment と line が設定されたテンプレートエントリ
    const template = [entry('DB_HOST', 'localhost', 5, 'Database host')];
    const env: EnvEntry[] = [];

    // When: 差分チェックを実行
    const result = findMissingKeys(template, env);

    // Then: 全フィールドが保持される
    expect(result[0]?.key).toBe('DB_HOST');
    expect(result[0]?.value).toBe('localhost');
    expect(result[0]?.line).toBe(5);
    expect(result[0]?.comment).toBe('Database host');
  });

  // ──────────────────────────────
  // 境界値
  // ──────────────────────────────

  it('should return empty when both template and env are empty', () => {
    // Given: 両方空配列
    const template: EnvEntry[] = [];
    const env: EnvEntry[] = [];

    // When: 差分チェックを実行
    const result = findMissingKeys(template, env);

    // Then: 空配列
    expect(result).toHaveLength(0);
  });

  it('should return empty when template is empty', () => {
    // Given: テンプレートが空、envにキーあり
    const template: EnvEntry[] = [];
    const env = [entry('A')];

    // When: 差分チェックを実行
    const result = findMissingKeys(template, env);

    // Then: 空配列
    expect(result).toHaveLength(0);
  });

  it('should handle single template entry present in env', () => {
    // Given: テンプレート1エントリ、envに同じキー
    const template = [entry('A')];
    const env = [entry('A')];

    // When: 差分チェックを実行
    const result = findMissingKeys(template, env);

    // Then: 不足なし
    expect(result).toHaveLength(0);
  });

  it('should handle single template entry missing from env', () => {
    // Given: テンプレート1エントリ、env は空
    const template = [entry('A')];
    const env: EnvEntry[] = [];

    // When: 差分チェックを実行
    const result = findMissingKeys(template, env);

    // Then: 1件不足
    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe('A');
  });

  it('should work with ignorePatterns as undefined', () => {
    // Given: ignorePatterns が undefined
    const template = [entry('A')];
    const env: EnvEntry[] = [];

    // When: ignorePatterns なしで差分チェック
    const result = findMissingKeys(template, env, undefined);

    // Then: 通常通り動作
    expect(result).toHaveLength(1);
  });

  it('should work with ignorePatterns as empty array', () => {
    // Given: ignorePatterns が空配列
    const template = [entry('A')];
    const env: EnvEntry[] = [];

    // When: 空配列の ignorePatterns で差分チェック
    const result = findMissingKeys(template, env, []);

    // Then: 通常通り動作
    expect(result).toHaveLength(1);
  });

  // ──────────────────────────────
  // 異常系
  // ──────────────────────────────

  it('should skip invalid regex patterns gracefully', () => {
    // Given: 無効な正規表現パターンを含む ignorePatterns
    const template = [entry('A'), entry('OPTIONAL_B', '', 2)];
    const env: EnvEntry[] = [];

    // When: 無効パターンと有効パターンを混在させて差分チェック
    const result = findMissingKeys(template, env, ['[invalid', '^OPTIONAL_']);

    // Then: 無効パターンはスキップされ、有効パターンのみが適用される
    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe('A');
  });

  it('should handle multiple ignorePatterns', () => {
    // Given: 複数の ignorePatterns
    const template = [
      entry('DB_HOST'),
      entry('TEST_KEY', '', 2),
      entry('OPTIONAL_KEY', '', 3),
      entry('PROD_KEY', '', 4),
    ];
    const env: EnvEntry[] = [];

    // When: 複数パターンで差分チェック
    const result = findMissingKeys(template, env, ['^TEST_', '^OPTIONAL_']);

    // Then: DB_HOST と PROD_KEY が不足
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.key)).toEqual(['DB_HOST', 'PROD_KEY']);
  });

  it('should not ignore keys that partially match ignorePatterns', () => {
    // Given: パターンが部分一致するキー
    const template = [entry('MY_TEST_KEY'), entry('TESTING')];
    const env: EnvEntry[] = [];

    // When: ^TEST_ パターンで差分チェック（先頭一致のみ）
    const result = findMissingKeys(template, env, ['^TEST_']);

    // Then: MY_TEST_KEY は除外されない（先頭が TEST_ ではない）、TESTING も除外されない
    expect(result).toHaveLength(2);
  });
});

/**
 * 実行コマンド:
 *   npm run test                                  # 全テスト実行
 *   npx vitest run src/test/diffChecker.test.ts    # 単一ファイル実行
 *
 * カバレッジ取得:
 *   npx vitest run --coverage
 */
