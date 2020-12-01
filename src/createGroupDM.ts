import * as vscode from "vscode";
import { apiBaseUrl } from "./constants";
import { getNonce } from "./getNonce";
import { Util } from "./util";
import axios from "axios";

export class createGroupDM {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: createGroupDM | undefined;

  public static readonly viewType = "createDM";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (createGroupDM.currentPanel) {
      createGroupDM.currentPanel._panel.reveal(column);
      createGroupDM.currentPanel._update();
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      createGroupDM.viewType, 'Create Group DM',
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "out/compiled"),
        ],
      }
    );

    createGroupDM.currentPanel = new createGroupDM(
      panel,
      extensionUri
    );
  }

  public static revive(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri
  ) {
    createGroupDM.currentPanel = new createGroupDM(
      panel,
      extensionUri
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public dispose() {
    createGroupDM.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private async _update() {
    const webview = this._panel.webview;

    this._panel.webview.html = this._getHtmlForWebview(webview);
    webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "formSubmission": {
          axios.post(`${apiBaseUrl}/api/groups/create?access_token=${Util.getAccessToken()}`, data.value)
            .then(response => {
              vscode.window.showInformationMessage(`${data.value.name} successfully created`);
              vscode.commands.executeCommand("vscode-dms.refresh");
              vscode.commands.executeCommand("workbench.action.closeActiveEditor");
            })
            .catch(err => {
              console.log(err);
              vscode.window.showErrorMessage(`${err}`);
              vscode.commands.executeCommand("workbench.action.closeActiveEditor");
            });
          break;
        }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // // And the uri we use to load this script in the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/createGroupDM.js")
    );

    // Local path to css styles
    const styleResetPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "reset.css"
    );

    const stylesPathMainPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "vscode.css"
    );

    const stylescreateGroupDMPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "createGroupDM.css"
    );

    // Uri to load styles into webview
    const stylesResetUri = webview.asWebviewUri(styleResetPath);
    const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
    const stylecreateGroupDMUri = webview.asWebviewUri(stylescreateGroupDMPath);
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/createGroupDM.css")
    );


    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="default-src * ${apiBaseUrl} https://*.googleapis.com data: blob: filesystem: about:; img-src * https: blob: data:; style-src ${webview.cspSource
      }; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${stylesResetUri}" rel="stylesheet">
        <link href="${stylesMainUri}" rel="stylesheet">
        <link href="${stylecreateGroupDMUri}" rel="stylesheet">
        <link href="${cssUri}" rel="stylesheet">
        <script nonce="${nonce}" src="${apiBaseUrl}/socket.io/socket.io.js"></script>
        <script nonce="${nonce}">
            const apiBaseUrl = "${apiBaseUrl}";
            const tsvscode = acquireVsCodeApi();
            const accessToken = "${Util.getAccessToken()}"
            const nonce = "${nonce}"
            const socket = io.connect(apiBaseUrl);
        </script>
			</head>
      <body>
      </body>
      <script nonce="${nonce}" src="${scriptUri}"></script>
      <script nonce="${nonce}" src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
			</html>`;
  }
}