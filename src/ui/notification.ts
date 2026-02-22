import * as vscode from 'vscode';

import type { EnvEntry } from '../checker/types';

const MAX_DISPLAY_KEYS = 10;

/** Show a warning notification listing missing variables with an action button */
export async function showMissingVarsWarning(
  missing: EnvEntry[],
): Promise<'addNow' | 'dismiss' | undefined> {
  const keyList = missing.slice(0, MAX_DISPLAY_KEYS).map((e) => e.key);
  const suffix = missing.length > MAX_DISPLAY_KEYS ? ` (+${missing.length - MAX_DISPLAY_KEYS} more)` : '';
  const message = `Env Guardman: ${missing.length} missing variable(s): ${keyList.join(', ')}${suffix}`;

  const selection = await vscode.window.showWarningMessage(message, 'Add Now', 'Dismiss');

  if (selection === 'Add Now') {
    return 'addNow';
  }
  if (selection === 'Dismiss') {
    return 'dismiss';
  }
  return undefined;
}
