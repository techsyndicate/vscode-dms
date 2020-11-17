import * as path from "path";
import * as vscode from "vscode";
import { accessTokenKey } from "./constants";


export class Util {
  static context: vscode.ExtensionContext;

  static getAccessToken() {
    return this.context.globalState.get<string>(accessTokenKey) || "";
  }

  static isLoggedIn() {
    return (
      !!this.context.globalState.get(accessTokenKey) 
    );
  }

  static getWorkspacePath() {
    const folders = vscode.workspace.workspaceFolders;
    return folders ? folders![0].uri.fsPath : undefined;
  }

  static getResource(rel: string) {
    return path
      .resolve(this.context.extensionPath, rel.replace(/\//g, path.sep))
      .replace(/\\/g, "/");
  }
}