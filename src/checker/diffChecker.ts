import type { EnvEntry } from './types';

/**
 * Find keys that exist in the template but are missing from the env file.
 *
 * @param templateEntries - Entries parsed from the template file (.env.example)
 * @param envEntries - Entries parsed from the actual env file (.env)
 * @param ignorePatterns - Optional regex patterns; matching keys are excluded from results
 * @returns Template entries whose keys are not found in envEntries
 */
export function findMissingKeys(
  templateEntries: EnvEntry[],
  envEntries: EnvEntry[],
  ignorePatterns?: string[],
): EnvEntry[] {
  const envKeys = new Set(envEntries.map((e) => e.key));
  const ignoreRegexes = compilePatterns(ignorePatterns);

  return templateEntries.filter((entry) => {
    if (envKeys.has(entry.key)) {
      return false;
    }
    if (isIgnored(entry.key, ignoreRegexes)) {
      return false;
    }
    return true;
  });
}

/** 正規表現パターン文字列をコンパイルし、無効なパターンはスキップする */
function compilePatterns(patterns?: string[]): RegExp[] {
  if (!patterns || patterns.length === 0) {
    return [];
  }

  const regexes: RegExp[] = [];
  for (const pattern of patterns) {
    try {
      regexes.push(new RegExp(pattern));
    } catch {
      // 無効な正規表現パターンはスキップ
    }
  }
  return regexes;
}

/** キーがいずれかの ignore パターンにマッチするか判定する */
function isIgnored(key: string, regexes: RegExp[]): boolean {
  return regexes.some((regex) => regex.test(key));
}
