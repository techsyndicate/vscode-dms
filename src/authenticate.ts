const polka = require('polka')
import * as vscode from "vscode";
import { accessTokenKey, apiBaseUrl } from "./constants";
import { Util } from "./util";


export const authenticate = () => {
  const app = polka();
  const server = app.listen(15015);
  vscode.commands.executeCommand(
    "vscode.open",
    vscode.Uri.parse(`${apiBaseUrl}/api/users/signin`)
  );
  app.get("/callback/:token", async (req: { params: { token: any; }; }, res: { end: (arg0: string) => void; }) => {
    const { token } = req.params;
    if (!token) {
      res.end(`ext: something went wrong`);
      (app as any).server.close();
      return;
    }

    console.log(token)
    await Util.context.globalState.update(accessTokenKey, token);

    res.end(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta
          http-equiv="Content-Security-Policy"
          content="default-src vscode-resource:; form-action vscode-resource:; frame-ancestors vscode-resource:; img-src vscode-resource: https:; script-src 'self' 'unsafe-inline' vscode-resource:; style-src 'self' 'unsafe-inline' vscode-resource:;"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
      </head>
      <body>
          <h1>Authentication successful! you can now close this tab</h1>
          <style>
            html, body {
              background-color: black;
              color: white;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100%;
              width: 100%;
              margin: 0;
            }
          </style>
      </body>
    </html>
    `);

    (app as any).server.close();
    
    vscode.commands.executeCommand("workbench.action.reloadWindow")

    const panel = vscode.window.createWebviewPanel(
      'authSuccessful',
      'Auth Successful',
      vscode.ViewColumn.One,
      {}
      );
    panel.webview.html = getWebviewContent();

    function getWebviewContent() {
      return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
      <h1>Authorization successful!</h1>
      <h2>You now need to reopen VSCode inorder to start messaging!</h2>
      </body>
      </html>`;
    }
  });
};