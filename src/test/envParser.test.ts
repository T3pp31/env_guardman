/**
 * テスト観点表 — parseEnvContent
 *
 * | #  | 観点                                    | 分類     | 入力例                                      | 期待結果                                                |
 * |----|-----------------------------------------|----------|---------------------------------------------|--------------------------------------------------------|
 * | 1  | 標準的な KEY=value                       | 正常系   | `"DB_HOST=localhost"`                       | `[{ key: "DB_HOST", value: "localhost", line: 1 }]`    |
 * | 2  | 複数行の KEY=value                       | 正常系   | `"A=1\nB=2\nC=3"`                           | 3エントリ、各キー・値が正しい                             |
 * | 3  | 値に = を含む                            | 正常系   | `"URL=postgres://host:5432/db?opt=1"`       | value に `=` が含まれる                                  |
 * | 4  | ダブルクォート囲み                       | 正常系   | `'KEY="hello world"'`                       | `{ value: "hello world" }`                              |
 * | 5  | シングルクォート囲み                     | 正常系   | `"KEY='hello world'"`                       | `{ value: "hello world" }`                              |
 * | 6  | インラインコメント                       | 正常系   | `"KEY=value # this is comment"`             | `{ value: "value" }`                                    |
 * | 7  | コメント行の直前コメント付与             | 正常系   | `"# DB host\nDB_HOST=localhost"`            | `{ comment: "DB host" }`                                |
 * | 8  | KEY= (空値)                             | 境界値   | `"EMPTY_KEY="`                              | `{ key: "EMPTY_KEY", value: "" }`                       |
 * | 9  | KEY のみ (= なし)                       | 境界値   | `"ONLY_KEY"`                                | `{ key: "ONLY_KEY", value: "" }`                        |
 * | 10 | 空文字列入力                             | 境界値   | `""`                                        | `[]`                                                    |
 * | 11 | 空白のみの行                             | 異常系   | `"   \n  \t  "`                             | `[]`                                                    |
 * | 12 | コメント行のみ                           | 異常系   | `"# comment only"`                          | `[]`                                                    |
 * | 13 | Windows 改行 (\r\n)                     | 異常系   | `"A=1\r\nB=2\r\n"`                          | 2エントリ                                                |
 * | 14 | マルチバイト文字（キー・値）             | 特殊     | `"日本語キー=こんにちは"`                    | `{ key: "日本語キー", value: "こんにちは" }`             |
 * | 15 | 値にスペースを含む（クォートなし）       | 特殊     | `"KEY=hello world # comment"`               | `{ value: "hello world" }`                              |
 * | 16 | クォート内の # はコメントではない        | 特殊     | `'KEY="value # not comment"'`               | `{ value: "value # not comment" }`                      |
 * | 17 | = のみの行                               | 異常系   | `"=value"`                                  | `[]` (キーが空)                                          |
 * | 18 | 先頭/末尾に空白があるキー               | 正常系   | `"  KEY  =value"`                           | `{ key: "KEY", value: "value" }`                        |
 * | 19 | 空行でコメントがリセットされる           | 正常系   | `"# comment\n\nKEY=val"`                    | comment は undefined                                     |
 * | 20 | 閉じ引用符がないダブルクォート           | 異常系   | `'KEY="unclosed'`                           | `{ value: "unclosed" }`                                 |
 * | 21 | 閉じ引用符がないシングルクォート         | 異常系   | `"KEY='unclosed"`                           | `{ value: "unclosed" }`                                 |
 * | 22 | 行番号の正確性                           | 正常系   | `"# comment\nKEY=val\n\nKEY2=val2"`        | KEY: line 2, KEY2: line 4                               |
 */

import { describe, it, expect } from 'vitest';

import { parseEnvContent } from '../checker/envParser';

describe('parseEnvContent', () => {
  // ──────────────────────────────
  // 正常系
  // ──────────────────────────────

  it('should parse standard KEY=value format', () => {
    // Given: 標準的な KEY=value 形式の文字列
    const input = 'DB_HOST=localhost';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: キーと値が正しく抽出される
    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe('DB_HOST');
    expect(result[0]?.value).toBe('localhost');
    expect(result[0]?.line).toBe(1);
  });

  it('should parse multiple KEY=value lines', () => {
    // Given: 複数行の入力
    const input = 'A=1\nB=2\nC=3';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: 3エントリが返される
    expect(result).toHaveLength(3);
    expect(result[0]?.key).toBe('A');
    expect(result[0]?.value).toBe('1');
    expect(result[1]?.key).toBe('B');
    expect(result[1]?.value).toBe('2');
    expect(result[2]?.key).toBe('C');
    expect(result[2]?.value).toBe('3');
  });

  it('should handle value containing equals sign', () => {
    // Given: 値に = を含む行
    const input = 'DATABASE_URL=postgres://host:5432/db?opt=1';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: 最初の = のみで分割される
    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe('DATABASE_URL');
    expect(result[0]?.value).toBe('postgres://host:5432/db?opt=1');
  });

  it('should strip double quotes from value', () => {
    // Given: ダブルクォートで囲まれた値
    const input = 'KEY="hello world"';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: クォートが除去される
    expect(result[0]?.value).toBe('hello world');
  });

  it('should strip single quotes from value', () => {
    // Given: シングルクォートで囲まれた値
    const input = "KEY='hello world'";

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: クォートが除去される
    expect(result[0]?.value).toBe('hello world');
  });

  it('should remove inline comments from unquoted values', () => {
    // Given: インラインコメント付きの値
    const input = 'KEY=value # this is comment';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: コメント部分が除去される
    expect(result[0]?.value).toBe('value');
  });

  it('should attach preceding comment to entry', () => {
    // Given: コメント行の直後にキーがある
    const input = '# DB host\nDB_HOST=localhost';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: comment フィールドにコメントが設定される
    expect(result).toHaveLength(1);
    expect(result[0]?.comment).toBe('DB host');
    expect(result[0]?.key).toBe('DB_HOST');
  });

  it('should handle key with leading/trailing whitespace', () => {
    // Given: キーの前後に空白がある行
    const input = '  KEY  =value';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: キーの空白がトリムされる
    expect(result[0]?.key).toBe('KEY');
    expect(result[0]?.value).toBe('value');
  });

  it('should reset pending comment after empty line', () => {
    // Given: コメントの後に空行がある
    const input = '# comment\n\nKEY=val';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: 空行でコメントがリセットされる
    expect(result[0]?.comment).toBeUndefined();
  });

  it('should assign correct line numbers', () => {
    // Given: コメント・空行を含む複数行
    const input = '# comment\nKEY=val\n\nKEY2=val2';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: 行番号が正しい (1-indexed)
    expect(result[0]?.line).toBe(2);
    expect(result[1]?.line).toBe(4);
  });

  it('should handle value with space before inline comment', () => {
    // Given: 値にスペースを含む行 (インラインコメント付き)
    const input = 'KEY=hello world # comment';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: ` #` までを値とする
    expect(result[0]?.value).toBe('hello world');
  });

  // ──────────────────────────────
  // 境界値
  // ──────────────────────────────

  it('should return empty array for empty string input', () => {
    // Given: 空文字列
    const input = '';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: 空配列
    expect(result).toHaveLength(0);
  });

  it('should handle KEY= (empty value)', () => {
    // Given: 値が空の行
    const input = 'EMPTY_KEY=';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: key がセットされ value が空文字列
    expect(result[0]?.key).toBe('EMPTY_KEY');
    expect(result[0]?.value).toBe('');
  });

  it('should handle KEY without equals sign', () => {
    // Given: = がない行
    const input = 'ONLY_KEY';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: key がセットされ value が空文字列
    expect(result[0]?.key).toBe('ONLY_KEY');
    expect(result[0]?.value).toBe('');
  });

  // ──────────────────────────────
  // 異常系
  // ──────────────────────────────

  it('should ignore whitespace-only lines', () => {
    // Given: 空白のみの行
    const input = '   \n  \t  ';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: 空配列
    expect(result).toHaveLength(0);
  });

  it('should return empty array for comment-only input', () => {
    // Given: コメント行のみ
    const input = '# comment only';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: 空配列
    expect(result).toHaveLength(0);
  });

  it('should handle Windows line endings (CRLF)', () => {
    // Given: Windows 改行の入力
    const input = 'A=1\r\nB=2\r\n';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: 正しく2エントリ
    expect(result).toHaveLength(2);
    expect(result[0]?.key).toBe('A');
    expect(result[1]?.key).toBe('B');
  });

  it('should skip lines where key is empty (=value)', () => {
    // Given: = で始まる行（キーが空）
    const input = '=value';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: スキップされ空配列
    expect(result).toHaveLength(0);
  });

  it('should handle unclosed double quote', () => {
    // Given: 閉じ引用符がないダブルクォート
    const input = 'KEY="unclosed';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: 先頭の " を除去した値
    expect(result[0]?.value).toBe('unclosed');
  });

  it('should handle unclosed single quote', () => {
    // Given: 閉じ引用符がないシングルクォート
    const input = "KEY='unclosed";

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: 先頭の ' を除去した値
    expect(result[0]?.value).toBe('unclosed');
  });

  // ──────────────────────────────
  // 特殊ケース
  // ──────────────────────────────

  it('should handle multibyte characters in key and value', () => {
    // Given: マルチバイト文字を含む行
    const input = '日本語キー=こんにちは';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: マルチバイト文字が正しくパースされる
    expect(result[0]?.key).toBe('日本語キー');
    expect(result[0]?.value).toBe('こんにちは');
  });

  it('should not treat # inside double quotes as comment', () => {
    // Given: ダブルクォート内に # がある
    const input = 'KEY="value # not comment"';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: # がコメントとして扱われない
    expect(result[0]?.value).toBe('value # not comment');
  });

  it('should not treat # inside single quotes as comment', () => {
    // Given: シングルクォート内に # がある
    const input = "KEY='value # not comment'";

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: # がコメントとして扱われない
    expect(result[0]?.value).toBe('value # not comment');
  });

  it('should handle mixed content (comments, blank lines, entries)', () => {
    // Given: コメント、空行、エントリが混在する入力
    const input = [
      '# Database settings',
      'DB_HOST=localhost',
      'DB_PORT=5432',
      '',
      '# Redis',
      'REDIS_URL=redis://localhost:6379',
      '',
      '# Optional',
      '',
      'DEBUG=true',
    ].join('\n');

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: 4エントリが正しくパースされる
    expect(result).toHaveLength(4);
    expect(result[0]?.key).toBe('DB_HOST');
    expect(result[0]?.comment).toBe('Database settings');
    expect(result[1]?.key).toBe('DB_PORT');
    expect(result[1]?.comment).toBeUndefined();
    expect(result[2]?.key).toBe('REDIS_URL');
    expect(result[2]?.comment).toBe('Redis');
    expect(result[3]?.key).toBe('DEBUG');
    expect(result[3]?.comment).toBeUndefined();
  });

  it('should handle trailing newline', () => {
    // Given: 末尾に改行がある
    const input = 'KEY=value\n';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: 1エントリのみ
    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe('KEY');
  });

  it('should handle multiple consecutive comment lines (only last one attached)', () => {
    // Given: 連続するコメント行
    const input = '# first comment\n# second comment\nKEY=value';

    // When: パース処理を実行
    const result = parseEnvContent(input);

    // Then: 最後のコメントのみが付与される
    expect(result[0]?.comment).toBe('second comment');
  });
});

/**
 * 実行コマンド:
 *   npm run test                              # 全テスト実行
 *   npx vitest run src/test/envParser.test.ts  # 単一ファイル実行
 *
 * カバレッジ取得:
 *   npx vitest run --coverage
 */
