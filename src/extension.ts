import * as fs from 'node:fs';
import * as path from 'node:path';

import * as vscode from 'vscode';

import type { EnvEntry } from './checker/types';
import { parseEnvContent } from './checker/envParser';
import { findMissingKeys } from './checker/diffChecker';
import { getSettings } from './config/settings';
import { createStatusBar, updateStatusBar } from './ui/statusBar';
import { showMissingVarsWarning } from './ui/notification';
import { runInputWizard } from './ui/inputWizard';
import { createFileWatcher } from './watcher/fileWatcher';
import { createGitWatcher } from './watcher/gitWatcher';

let outputChannel: vscode.OutputChannel;
let statusBarItem: vscode.StatusBarItem;
let lastMissing: EnvEntry[] = [];

export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel('Env Guardman');
  context.subscriptions.push(outputChannel);

  statusBarItem = createStatusBar();
  context.subscriptions.push(statusBarItem);

  // コマンド登録
  context.subscriptions.push(
    vscode.commands.registerCommand('envGuardman.check', () => runCheck()),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('envGuardman.addMissing', () => runAddMissing()),
  );

  // ファイル保存監視
  const settings = getSettings();
  const fileWatcherDisposable = createFileWatcher(
    settings.templateFile,
    settings.envFile,
    () => {
      if (getSettings().checkOnSave) {
        runCheck();
      }
    },
  );
  context.subscriptions.push(fileWatcherDisposable);

  // Git ブランチ切り替え監視
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders) {
    for (const folder of workspaceFolders) {
      const gitWatcherDisposable = createGitWatcher(folder, () => {
        if (getSettings().checkOnBranchSwitch) {
          runCheck();
        }
      });
      context.subscriptions.push(gitWatcherDisposable);
    }
  }

  // 起動時チェック
  if (settings.checkOnOpen) {
    runCheck();
  }

  outputChannel.appendLine('Env Guardman activated');
}

export function deactivate(): void {
  // Disposables are managed via context.subscriptions
}

/** Run the diff check and show notification if needed */
async function runCheck(): Promise<void> {
  const settings = getSettings();
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length === 0) {
    outputChannel.appendLine('No workspace folder open');
    updateStatusBar(statusBarItem, 0);
    return;
  }

  const rootPath = workspaceFolders[0]!.uri.fsPath;
  const templatePath = path.join(rootPath, settings.templateFile);
  const envPath = path.join(rootPath, settings.envFile);

  // .env.example が存在しない → チェックをスキップ
  const templateContent = readFileSafe(templatePath);
  if (templateContent === undefined) {
    outputChannel.appendLine(`Template file not found: ${settings.templateFile}`);
    updateStatusBar(statusBarItem, 0);
    return;
  }

  // .env が存在しない → 全キーが不足
  const envContent = readFileSafe(envPath) ?? '';

  const templateEntries = parseEnvContent(templateContent);
  const envEntries = parseEnvContent(envContent);
  const missing = findMissingKeys(templateEntries, envEntries, settings.ignorePatterns);

  lastMissing = missing;
  updateStatusBar(statusBarItem, missing.length);

  outputChannel.appendLine(`Check complete: ${missing.length} missing variable(s)`);
  for (const entry of missing) {
    outputChannel.appendLine(`  Missing key: ${entry.key}`);
  }

  if (missing.length > 0) {
    const action = await showMissingVarsWarning(missing);
    if (action === 'addNow') {
      await runInputWizard(missing, envPath, outputChannel);
      // 追記後に再チェック
      await runCheck();
    }
  }
}

/** Run the add missing variables wizard directly */
async function runAddMissing(): Promise<void> {
  if (lastMissing.length === 0) {
    // まずチェックを実行
    await runCheck();
  }

  if (lastMissing.length === 0) {
    vscode.window.showInformationMessage('Env Guardman: No missing variables found.');
    return;
  }

  const settings = getSettings();
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return;
  }

  const rootPath = workspaceFolders[0]!.uri.fsPath;
  const envPath = path.join(rootPath, settings.envFile);

  await runInputWizard(lastMissing, envPath, outputChannel);
  await runCheck();
}

/** Read a file safely, returning undefined if it doesn't exist */
function readFileSafe(filePath: string): string | undefined {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return undefined;
  }
}
