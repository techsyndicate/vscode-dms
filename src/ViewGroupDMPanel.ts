import * as vscode from "vscode";
import { apiBaseUrl } from "./constants";
import { getNonce } from "./getNonce";
import { Util } from "./util";
import axios from 'axios';

export class ViewGroupDMPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: ViewGroupDMPanel | undefined;

  public static readonly viewType = "viewGroupDM";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _group: any;
  private _socketID: any;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, group: any, socketID: any) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (ViewGroupDMPanel.currentPanel) {
      ViewGroupDMPanel.currentPanel._panel.reveal(column);
      ViewGroupDMPanel.currentPanel._group = group;
      ViewGroupDMPanel.currentPanel._socketID = socketID;
      ViewGroupDMPanel.currentPanel._update();
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      ViewGroupDMPanel.viewType, 'Chat',
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

    ViewGroupDMPanel.currentPanel = new ViewGroupDMPanel(
      panel,
      extensionUri,
      group,
      socketID
    );
  }

  public static revive(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    group: any,
    socketID: string
  ) {
    ViewGroupDMPanel.currentPanel = new ViewGroupDMPanel(
      panel,
      extensionUri,
      group,
      socketID
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    group: string,
    socketID: string
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._group = group;
    this._socketID = socketID;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public dispose() {
    ViewGroupDMPanel.currentPanel = undefined;

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
        case "notificationMessage": {
          if (data.value.group) {
            vscode.window.showInformationMessage(data.value.receiver + ': ' + data.value.sender + ': ' + data.value.message);
          } else {
            vscode.window.showInformationMessage(data.value.sender + ': ' + data.value.message);
          }
          console.log(data.value);
          console.log(data.value.message);
          break;
        }
        case "refreshSidebar": {
          vscode.commands.executeCommand("vscode-dms.refresh");
          break;
        }
        case "close": {
          await axios.get(`${apiBaseUrl}/api/users/socket?access_token=${Util.getAccessToken()}&socket_id=${this._socketID}`);
          vscode.window.showInformationMessage('You will now recieve notifications while working');
          vscode.commands.executeCommand("workbench.action.closeActiveEditor");
          break;
        }
        case "sendUnread": {
          console.log('it has come here')
          await axios.post(`${apiBaseUrl}/api/users/unread?access_token=${Util.getAccessToken()}&conversation_id=${data.value.conversation_id}`)
          console.log('awaited')
          break;
        }
        case "delete": {
          console.log(data.value.conversation_id)
          console.log(data.value.clientUsername)
          console.log(data.value.adminUsername)
          if(data.value.clientUsername != data.value.adminUsername) {
            vscode.window.showErrorMessage('Only the admin can delete the group');
            break
          }
          else {
            const choice = await vscode.window.showInformationMessage(
              "Are u sure you want to delete the group?",
              "Yes",
              "Cancel"
            );
            if (choice === "Yes") {
              const url = `${apiBaseUrl}/api/groups/delete?access_token=${Util.getAccessToken()}&conversation_id=${data.value.conversation_id}`
              console.log(url)
              await axios.get(url)
              vscode.commands.executeCommand("vscode-dms.refresh")
              vscode.window.showInformationMessage('Successfully deleted');
              vscode.commands.executeCommand("workbench.action.closeActiveEditor");
            } else {
              break
            }
          }
          break;
        }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // // And the uri we use to load this script in the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/grpdmpanel.js")
    );

    const receiveSocketUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "receiveSocket.js")
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

    const stylesGroupDMPanelPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "dmpanel.css"
    );

    // Uri to load styles into webview
    const stylesResetUri = webview.asWebviewUri(styleResetPath);
    const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
    const styleGroupDMPanelUri = webview.asWebviewUri(stylesGroupDMPanelPath);
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/grpdmpanel.css")
    );

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();
    let membersString = ''
    const membersArray = this._group.members
    for(let i=0; i< membersArray.length; i++) {
      if(i == membersArray.length-1) {
        membersString += `${membersArray[i]}`
      }
      else {
        membersString += `${membersArray[i]}, `
      }
    }

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
        <link href="${styleGroupDMPanelUri}" rel="stylesheet">
        <link href="${cssUri}" rel="stylesheet">
        <script nonce="${nonce}" src="${apiBaseUrl}/socket.io/socket.io.js"></script>
        <script nonce="${nonce}" src="${receiveSocketUri}"></script>
        <script nonce="${nonce}">
            const apiBaseUrl = "${apiBaseUrl}";
            const tsvscode = acquireVsCodeApi();
            const accessToken = "${Util.getAccessToken()}"
            const groupName = "${this._group.name}"
            const name = groupName
            const imageUrl = "${this._group.avatar_url}"
            const membersString = "${membersString}"
            const nonce = "${nonce}"
            let clientUsername = "";
            const socket = io.connect(apiBaseUrl);
            const conversation_id = "${this._group.conversation_id}"
            const adminUsername = "${this._group.admin}"
        </script>
            <title>${this._group.name}</title>
			</head>
      <body>
      </body>
      <script nonce="${nonce}" src="${scriptUri}"></script>
      <script nonce="${nonce}" src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
			</html>`;
  }
}