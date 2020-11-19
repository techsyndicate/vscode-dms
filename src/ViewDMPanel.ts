import * as vscode from "vscode";
import { apiBaseUrl } from "./constants";
import { getNonce } from "./getNonce";
import { Util } from "./util";

export class ViewDMPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: ViewDMPanel | undefined;

  public static readonly viewType = "viewDM";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _user: any;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, user: any) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (ViewDMPanel.currentPanel) {
      ViewDMPanel.currentPanel._panel.reveal(column);
      ViewDMPanel.currentPanel._user = user;
      ViewDMPanel.currentPanel._update();
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      ViewDMPanel.viewType, 'Chat',
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

    ViewDMPanel.currentPanel = new ViewDMPanel(
      panel,
      extensionUri,
      user
    );
  }

  public static revive(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    user: any
  ) {
    ViewDMPanel.currentPanel = new ViewDMPanel(
      panel,
      extensionUri,
      user
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    user: string
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._user = user;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public dispose() {
    ViewDMPanel.currentPanel = undefined;

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
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // // And the uri we use to load this script in the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/dmpanel.js")
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
    
    // Uri to load styles into webview
    const stylesResetUri = webview.asWebviewUri(styleResetPath);
    const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
    const cssUri = webview.asWebviewUri(
    vscode.Uri.joinPath(this._extensionUri, "out", "compiled/dmpanel.css")
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
        <meta http-equiv="Content-Security-Policy" content="default-src ${apiBaseUrl}; img-src https: data:; style-src ${
      webview.cspSource
    }; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">
                <link href="${cssUri}" rel="stylesheet">
                <script nonce="${nonce}" src="${apiBaseUrl}/socket.io/socket.io.js"></script>
        <script nonce="${nonce}">
            const apiBaseUrl = "${apiBaseUrl}";
            const tsvscode = acquireVsCodeApi();
            const accessToken = "${Util.getAccessToken()}"
            const username = "${this._user.username}"
            const imageUrl = "${this._user.avatar_url}"
        </script>
            <title>${this._user.username}</title>
			</head>
      <body>
			</body>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</html>`;
  }
}