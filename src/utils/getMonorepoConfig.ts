import { MARKER_FOLDER } from "../constants";
import { pathExists } from "./pathExists";
import * as path from "path";
import * as fs from "fs-extra";
import Utils from "./utils";

export type IMonorepoConfig = {
  projects: {
    [repoName: string]: string
  },
  packagesFolder: string
}
export function getMonorepoConfig(): IMonorepoConfig {
  const rootPath = Utils.folder.getRootPath() as string;
  if (!rootPath) return null;

  const markerFolderPath = path.join(rootPath, MARKER_FOLDER);
  const configFilePath = path.join(markerFolderPath, "config");
  if (!pathExists(markerFolderPath)) return null;
  if (!pathExists(configFilePath)) return null;

  let config = null;
  try {
    config = fs.readJSONSync(configFilePath);
  } catch (err) {}

  return config;
}
