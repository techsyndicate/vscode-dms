import * as vscode from 'vscode';
import { authenticate } from "./authenticate"
import { DMSidebarProvider } from "./DMSidebarProvider";
import { Util } from "./util"
import * as fs from "fs"

export async function activate(context: vscode.ExtensionContext) {
	Util.context = context;
	if(!Util.isLoggedIn()) {
		const choice = await vscode.window.showInformationMessage(
			`You need to login to GitHub to start messaging, would you like to continue?`,
			"Yes",
			"Cancel"
		);
		if (choice === "Yes") {
			authenticate()
		}
	}
	console.log('yoz! vscode-dms is active.');

	vscode.commands.registerCommand('vscode-dms.info', () => {
		const panel = vscode.window.createWebviewPanel(
			'info',
			'Information',
			vscode.ViewColumn.One,
			{}
		  );
		panel.webview.html = getWebviewContent();
	})

	function getWebviewContent() {
		return `<!DOCTYPE html>
	  <html lang="en">
	  <head>
		  <meta charset="UTF-8">
		  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  </head>
	  <body>
	  <h1>VSCode DMs</h1>
	  <h2>Features:</h2>
		<p>1. DM your following from Github through VSCode</p>
		<p>2. Get to know when they are online</p>
		<p>3. Share code easily through DMs</p>
		
	  <h2>GitHub repositories:</h2>
	  	<a href="https://github.com/techsyndicate/vscode-dms"><p>https://github.com/techsyndicate/vscode-dms<p></a>
		<a href="https://github.com/techsyndicate/vscode-dms-api"><p>https://github.com/techsyndicate/vscode-dms-api<p></a>
		
	  <h2>Developed by:</h2>
	  <p><a style="text-decoration: none;color:white" href="https://github.com/laxyapahuja">Laxya Pahuja</a>, <a style="text-decoration: none;color:white" href="https://github.com/sheldor1510">Anshul Saha</a> and <a style="text-decoration: none;color:white" href="https://github.com/oorjitchowdhary">Oorjit Chowdhary</a></p>
	  </body>
	  </html>`;
	}

	vscode.commands.registerCommand('vscode-dms.sendMessage', async () => {
		const editor = vscode.window.activeTextEditor;
		const selection = editor && editor.selection;
		console.log(selection)
		let windowTitle = '';
		if(editor) {
			const activeFileName = editor.document.uri.path.slice(1, editor.document.uri.path.length)
			windowTitle = `${vscode.workspace.name} - ${activeFileName}`;
			console.log(activeFileName)
			console.log(windowTitle)
			fs.readFile(activeFileName, (err, data) => {
				console.log(data)
				if(err) {
					console.log(err)
				}
			})
		}
		
	} )

	const provider = new DMSidebarProvider(context.extensionUri);
	context.subscriptions.push(
	  vscode.window.registerWebviewViewProvider("dm-full", provider)
	);
}


export function deactivate() {}
