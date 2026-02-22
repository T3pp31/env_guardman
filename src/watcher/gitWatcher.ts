import * as vscode from 'vscode';

const DEBOUNCE_MS = 500;

/**
 * Create a watcher on .git/HEAD to detect branch switches.
 * Uses debounce to avoid multiple rapid fires.
 *
 * @param workspaceFolder - The workspace folder to watch
 * @param callback - Function to call when a branch switch is detected
 * @returns Disposable to clean up the watcher
 */
export function createGitWatcher(
  workspaceFolder: vscode.WorkspaceFolder,
  callback: () => void,
): vscode.Disposable {
  const pattern = new vscode.RelativePattern(workspaceFolder, '.git/HEAD');
  const watcher = vscode.workspace.createFileSystemWatcher(pattern);

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  const debouncedCallback = (): void => {
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      callback();
    }, DEBOUNCE_MS);
  };

  // Git の操作によって change / create のどちらが発火するか不定
  const changeDisposable = watcher.onDidChange(debouncedCallback);
  const createDisposable = watcher.onDidCreate(debouncedCallback);

  return vscode.Disposable.from(watcher, changeDisposable, createDisposable, {
    dispose: () => {
      if (debounceTimer !== undefined) {
        clearTimeout(debounceTimer);
      }
    },
  });
}
