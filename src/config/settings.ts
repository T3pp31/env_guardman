import * as vscode from 'vscode';

/** Extension configuration values */
export interface ExtensionSettings {
  templateFile: string;
  envFile: string;
  ignorePatterns: string[];
  checkOnOpen: boolean;
  checkOnBranchSwitch: boolean;
  checkOnSave: boolean;
}

/** Read current extension settings from VS Code configuration */
export function getSettings(): ExtensionSettings {
  const config = vscode.workspace.getConfiguration('envGuardman');

  return {
    templateFile: config.get<string>('templateFile', '.env.example'),
    envFile: config.get<string>('envFile', '.env'),
    ignorePatterns: config.get<string[]>('ignorePatterns', []),
    checkOnOpen: config.get<boolean>('checkOnOpen', true),
    checkOnBranchSwitch: config.get<boolean>('checkOnBranchSwitch', true),
    checkOnSave: config.get<boolean>('checkOnSave', true),
  };
}
