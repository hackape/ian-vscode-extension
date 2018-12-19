import * as vscode from 'vscode';
import { RepoTreeProvider} from './reposView'

export function activate(context: vscode.ExtensionContext) {

	const repoTreeProvider = new RepoTreeProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('repos', repoTreeProvider);
	vscode.commands.registerCommand('repos.refresh', () => repoTreeProvider.refresh());
	vscode.commands.registerCommand('repos.openEntry', (repo) => repoTreeProvider.openEntry(repo));
}
