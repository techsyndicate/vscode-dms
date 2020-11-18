import * as vscode from 'vscode';
import { authenticate } from "./authenticate"
import { DMSidebarProvider } from "./DMSidebarProvider";
import { Util } from "./util"

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

	const provider = new DMSidebarProvider(context.extensionUri);
	context.subscriptions.push(
	  vscode.window.registerWebviewViewProvider("dm-full", provider)
	);
}


export function deactivate() {}
