import * as fs from 'node:fs';

import * as vscode from 'vscode';

import type { EnvEntry } from '../checker/types';

/**
 * Run an interactive input wizard for missing variables.
 * Each missing variable is prompted one by one via InputBox.
 * Entered values are appended to the env file.
 */
export async function runInputWizard(
  missing: EnvEntry[],
  envFilePath: string,
  outputChannel: vscode.OutputChannel,
): Promise<void> {
  const linesToAppend: string[] = [];

  for (let i = 0; i < missing.length; i++) {
    const entry = missing[i]!;
    const stepLabel = `(${i + 1}/${missing.length})`;

    const userValue = await vscode.window.showInputBox({
      prompt: `${stepLabel} Enter value for ${entry.key}`,
      placeHolder: entry.comment ?? `Value for ${entry.key}`,
      value: entry.value || undefined,
      ignoreFocusOut: true,
    });

    if (userValue === undefined) {
      // ユーザーが ESC でキャンセル → コメントアウト状態で追記
      linesToAppend.push(`# ${entry.key}=`);
      outputChannel.appendLine(`Skipped: ${entry.key}`);
    } else {
      linesToAppend.push(`${entry.key}=${userValue}`);
      outputChannel.appendLine(`Added: ${entry.key}`);
    }
  }

  if (linesToAppend.length === 0) {
    return;
  }

  await appendToEnvFile(envFilePath, linesToAppend);
  outputChannel.appendLine(`Appended ${linesToAppend.length} variable(s) to ${envFilePath}`);
}

/** Append lines to the env file, ensuring a newline separator */
async function appendToEnvFile(filePath: string, lines: string[]): Promise<void> {
  let existing = '';
  try {
    existing = fs.readFileSync(filePath, 'utf-8');
  } catch {
    // ファイルが存在しない場合は空文字列
  }

  const separator = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
  const content = separator + lines.join('\n') + '\n';

  fs.appendFileSync(filePath, content, 'utf-8');
}
