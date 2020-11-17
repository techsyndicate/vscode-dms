import * as vscode from 'vscode';
import { authenticate } from "./authenticate"
import { DMSidebarProvider } from "./DMSidebarProvider";
import { Util } from "./util"

export function activate(context: vscode.ExtensionContext) {
	Util.context = context;
	console.log('yoz! vscode-dms is active.');

	const provider = new DMSidebarProvider(context.extensionUri);
	context.subscriptions.push(
	  vscode.window.registerWebviewViewProvider("dm-full", provider)
	);

	vscode.commands.registerCommand('vscode-dms.startMessaging', async () => {
		if(!Util.isLoggedIn()) {
			const choice = await vscode.window.showInformationMessage(
				`You need to login to GitHub to start messaging, would you like to continue?`,
				"Yes",
				"Cancel"
			);
			if (choice === "Yes") {
				authenticate()
			}
			return;
		}

		const userData = {
			username: 'laxyapahuja',
			img: 'https://github.com/laxyapahuja.png',
			access_token: '',
			conversations: {
			'oorjitchowdhary': 1218931928312983123,
			'sheldor1510': 290310293812983012380
		  }
		}

		const panel = vscode.window.createWebviewPanel(
			userData.username,
			'User Info',
			vscode.ViewColumn.One,
			{}
		  );
	
		// And set its HTML content
		panel.webview.html = getWebviewContent();
		function getWebviewContent() {
			return `<!DOCTYPE html>
		  <html lang="en">
		  <head>
			  <meta charset="UTF-8">
			  <meta name="viewport" content="width=device-width, initial-scale=1.0">
			  <title>User Info</title>
		  </head>
		  <body>
		  <br>
			  <img src="${userData.img}" width="300" />
			<br>
			<h1>${userData.username}</h1>
		  </body>
		  </html>`;
		  }
	});
}


export function deactivate() {}
