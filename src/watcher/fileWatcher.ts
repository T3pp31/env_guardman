import * as path from 'node:path';

import * as vscode from 'vscode';

/**
 * Create watchers that fire a callback when .env or .env.example files are saved.
 *
 * @param templateFileName - Template file name (e.g. ".env.example")
 * @param envFileName - Env file name (e.g. ".env")
 * @param callback - Function to call when a relevant file is saved
 * @returns Disposable to clean up the watchers
 */
export function createFileWatcher(
  templateFileName: string,
  envFileName: string,
  callback: () => void,
): vscode.Disposable {
  const disposable = vscode.workspace.onDidSaveTextDocument((doc) => {
    const fileName = path.basename(doc.uri.fsPath);
    if (fileName === templateFileName || fileName === envFileName) {
      callback();
    }
  });

  return disposable;
}
