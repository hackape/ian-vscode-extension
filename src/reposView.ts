import * as vscode from "vscode";
import * as fs from "fs-extra";
import * as path from "path";
import { pathExists } from './utils';
import { getMonorepoConfig, IMonorepoConfig } from './utils';

const REPOS_FOLDER = 'packages';


export class RepoTreeProvider implements vscode.TreeDataProvider<Repo> {
  private _onDidChangeTreeData = new vscode.EventEmitter<Repo | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Repo | undefined> = this._onDidChangeTreeData.event;

  private workspaceRoot: string | undefined = undefined;
  private monorepoConfig: IMonorepoConfig | null = null;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.collectMonorepoInformation();
  }

  private collectMonorepoInformation() {
    this.monorepoConfig = getMonorepoConfig()
  }

  private getGitmoduleEntryFromRepo(repo: Repo) {
    const repoName = repo.label;
    // const repoRemoteUrl = 
  return `[submodule "${repoName}"]
    path = ${this.monorepoConfig.packagesFolder}/${repoName}
    url = ${this.monorepoConfig.projects[repoName]}
`;
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire();
    this.collectMonorepoInformation();
  }

  public async openEntry(repo: Repo) {
    const dependencies = await this.getChildren(repo);
    const allRelatedRepos = [repo, ...dependencies]
    
    // write .gitmodules config
    const submoduleConfigs = allRelatedRepos.map(depRepo => this.getGitmoduleEntryFromRepo(depRepo));
    const submoduleConfigString = submoduleConfigs.join('\n')
    await fs.writeFile(path.resolve(this.workspaceRoot, '.gitmodules'), submoduleConfigString)

    // write `.vscode/settings.json > "files.exclude" field` 
    const workspaceSettingsJsonPath = path.resolve(this.workspaceRoot, '.vscode', 'settings.json');

    if (!pathExists(workspaceSettingsJsonPath)) {
      fs.writeFileSync(workspaceSettingsJsonPath, '{}');
    }

    const workspaceSettingsJson = await fs.readJSON(workspaceSettingsJsonPath)
    if (!workspaceSettingsJson['files.exclude']) workspaceSettingsJson['files.exclude'] = {};

    repo.siblings.forEach((siblingRepo) => {
      const key = `${this.monorepoConfig.packagesFolder}/${siblingRepo.label}`
      workspaceSettingsJson['files.exclude'][key] = true;
    })
    
    allRelatedRepos.forEach(repo => {
      const key = `${this.monorepoConfig.packagesFolder}/${repo.label}`;
      workspaceSettingsJson['files.exclude'][key] = false;
    })

    const updateWorkspaceFolders = (vscode.workspace as any).updateWorkspaceFolders;
    await fs.writeJSON(workspaceSettingsJsonPath, workspaceSettingsJson, {spaces: 2})

    const repoUriList = allRelatedRepos.map(repo => {
      const repoPath = path.resolve(this.workspaceRoot, this.monorepoConfig.packagesFolder, repo.label)
      return { uri: vscode.Uri.file(repoPath) }
    })

    const monorepoFolder = vscode.workspace.workspaceFolders[0];
    await updateWorkspaceFolders(0, vscode.workspace.workspaceFolders.length, { uri: monorepoFolder.uri }, ...repoUriList);
    vscode.commands.executeCommand('workbench.view.explorer');
  }

  getTreeItem(element: Repo): vscode.TreeItem {
    return element;
  }

  async getChildren(repo?: Repo): Promise<Repo[]> {
    if (!this.monorepoConfig) return [];
    if (!repo) {
      const reposDir = path.join(this.workspaceRoot, REPOS_FOLDER);
      const repoNames = await fs.readdir(reposDir).catch(() => [] as string[]).then(repoNames => {
				return repoNames.filter((repoName) => 
					pathExists(path.join(reposDir, repoName, 'package.json'))
				)
			});

      const siblings = new Map();
      const repos = repoNames.map(repoName => {
        const packageJsonPath = path.join(this.workspaceRoot, REPOS_FOLDER, repoName, "package.json");
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        const repo = new Repo(repoName, vscode.TreeItemCollapsibleState.Collapsed, packageJson);
        repo.siblings = siblings;
        siblings.set(repoName, repo);
        return repo;
      });

      return repos;
    }

    // case 4: with repo opened
    const dependencies = { 
      ...repo.packageJson.dependencies,
      ...repo.packageJson.devDependencies,
      ...repo.packageJson.peerDependencies
    };
    return Object.keys(dependencies)
      .filter(depName => repo.siblings.has(depName))
      .map(depName => {
				const originalRepo = repo.siblings.get(depName);
				const newRepo = new Repo(depName, vscode.TreeItemCollapsibleState.None, originalRepo.packageJson);
				return newRepo;
			});
  }
}

export class Repo extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public packageJson: any,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    const iconName = collapsibleState === 0 ? 'dependency' : 'folder';
    this.iconPath = {
      light: path.join(__filename, "..", "resources", "light", `${iconName}.svg`),
      dark: path.join(__filename, "..", "..", "resources", "dark", `${iconName}.svg`)
    }
  }

  public siblings: Map<string, Repo>;

  get tooltip(): string {
    return `${this.label}-${this.packageJson.version}`;
  }

  get description(): string {
    return this.packageJson.version;
  }

  contextValue = "repo";
}
