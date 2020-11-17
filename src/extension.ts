// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { authenticate } from "./authenticate"
import { accessTokenKey } from './constants';
import { Util } from "./util"
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-dms" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-dms.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from vscode-dms!');
	});

	vscode.commands.registerCommand('vscode-dms.startMessaging', async () => {
		const choice = await vscode.window.showInformationMessage(
			`You need to login to GitHub to start messaging, would you like to continue?`,
			"Yes",
			"Cancel"
		  );
		if (choice === "Yes") {
			authenticate()
		}
		console.log(Util.getAccessToken())
		return;
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
