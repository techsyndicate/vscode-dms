import * as vscode from "vscode";
import { apiBaseUrl } from "./constants";
import { getNonce } from "./getNonce";
import { Util } from "./util";
import { ViewDMPanel } from "./ViewDMPanel";
import { createGroupDM } from './createGroupDM';
import { ViewGroupDMPanel } from './ViewGroupDMPanel';

let user: string = '';
let fileName: string = 'sidebar';

export class DMSidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri, private readonly socketID: any, private readonly _extensionContext: vscode.ExtensionContext) { }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, this._extensionContext);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onContactPress": {
          if (!data.value) {
            return;
          }
          ViewDMPanel.createOrShow(this._extensionUri, data.value, this.socketID);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
        case "onCreateDMPress": {
          createGroupDM.createOrShow(this._extensionUri);
          break;
        }
        case "onGroupPress": {
          if (!data.value) {
            return;
          }
          ViewGroupDMPanel.createOrShow(this._extensionUri, data.value, this.socketID);
          break;
        }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview, extensionContext: vscode.ExtensionContext) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", `compiled/${fileName}.js`)
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", `compiled/${fileName}.css`)
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src ${apiBaseUrl}; img-src https: data:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
        <script nonce="${nonce}">
            const apiBaseUrl = "${apiBaseUrl}";
            const accessToken = "${Util.getAccessToken()}"
            const user = "${user}"
            const tsvscode = acquireVsCodeApi();
        </script>
			</head>
      <body>
      <!--
        <div class="dm-grid">
        </div>
      -->
      <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}