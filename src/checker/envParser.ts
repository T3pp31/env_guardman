import type { EnvEntry } from './types';

/**
 * Parse the content of an .env file into a list of entries.
 *
 * Supports:
 * - KEY=value
 * - KEY= (empty value)
 * - KEY (no equals sign, treated as empty value)
 * - Single/double quoted values
 * - Inline comments (# after unquoted value)
 * - Comment lines (# ...)
 * - Preceding comment lines attached to the next entry
 * - Windows line endings (\r\n)
 */
export function parseEnvContent(content: string): EnvEntry[] {
  const entries: EnvEntry[] = [];
  const lines = content.split(/\r?\n/);
  let pendingComment: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!;
    const trimmed = raw.trim();

    // 空行はコメントのリセット
    if (trimmed === '') {
      pendingComment = undefined;
      continue;
    }

    // コメント行
    if (trimmed.startsWith('#')) {
      pendingComment = trimmed.slice(1).trim();
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');

    let key: string;
    let value: string;

    if (equalsIndex === -1) {
      // KEY のみ (= なし)
      key = trimmed;
      value = '';
    } else {
      key = trimmed.slice(0, equalsIndex).trim();
      const rawValue = trimmed.slice(equalsIndex + 1);
      value = parseValue(rawValue);
    }

    // キーが空の場合はスキップ
    if (key === '') {
      pendingComment = undefined;
      continue;
    }

    const entry: EnvEntry = {
      key,
      value,
      line: i + 1,
    };

    if (pendingComment !== undefined) {
      entry.comment = pendingComment;
    }

    entries.push(entry);
    pendingComment = undefined;
  }

  return entries;
}

/** 値文字列をパースし、引用符除去とインラインコメント除去を行う */
function parseValue(rawValue: string): string {
  const trimmed = rawValue.trim();

  if (trimmed === '') {
    return '';
  }

  // ダブルクォートで囲まれた値
  if (trimmed.startsWith('"')) {
    const endQuote = trimmed.indexOf('"', 1);
    if (endQuote !== -1) {
      return trimmed.slice(1, endQuote);
    }
    // 閉じ引用符がない場合は先頭の " を除去して返す
    return trimmed.slice(1);
  }

  // シングルクォートで囲まれた値
  if (trimmed.startsWith("'")) {
    const endQuote = trimmed.indexOf("'", 1);
    if (endQuote !== -1) {
      return trimmed.slice(1, endQuote);
    }
    return trimmed.slice(1);
  }

  // クォートなし: インラインコメントを除去
  const commentIndex = trimmed.indexOf(' #');
  if (commentIndex !== -1) {
    return trimmed.slice(0, commentIndex).trimEnd();
  }

  return trimmed;
}
