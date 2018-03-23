import * as vscode from 'vscode';

function config(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('cargo');
}

export function automaticCheck(): boolean {
    return config().get("automaticCheck") === true;
}