import * as vscode from 'vscode';

/** Create the status bar item for Env Guardman */
export function createStatusBar(): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.command = 'envGuardman.check';
  item.tooltip = 'Env Guardman: Click to check missing variables';
  item.show();
  return item;
}

/** Update the status bar item based on the number of missing variables */
export function updateStatusBar(item: vscode.StatusBarItem, missingCount: number): void {
  if (missingCount === 0) {
    item.text = '$(check) .env OK';
    item.backgroundColor = undefined;
  } else {
    item.text = `$(warning) .env: ${missingCount} missing`;
    item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
  }
}
