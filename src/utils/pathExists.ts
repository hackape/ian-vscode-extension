import * as fs from "fs-extra";
import * as path from 'path';
import * as vscode from "vscode";

export function pathExists(p: string) {
	try {
		fs.accessSync(p);
	} catch (err) {
		return false;
	}
	return true;
}

function isSingleWorkspaceRoot() {
  const { workspaceFolders } = vscode.workspace;
  if (!workspaceFolders) return false;
  if (workspaceFolders.length !== 1) return false;
  return true;
}

export function pathExistsInWorkspace(p: string) {
  if (!isSingleWorkspaceRoot()) return false;
  const { workspaceFolders } = vscode.workspace;
  const rootPath = workspaceFolders[0].uri.fsPath;
  return pathExists(path.join(rootPath, p));
}