import * as vscode from 'vscode';
import * as util from './util';
import { logAndShowError } from './util';
import * as cargo from './cargo';

export async function cargo_add() {
    let cwd = util.getCwd();

    let input = await vscode.window.showInputBox();
    if (input === undefined) {
        return;
    }

    let packages = await cargo.search(input);
    let items = packages.map((pkg: cargo.Package): vscode.QuickPickItem => ({
        label: pkg.name,
        detail: `All-time DLs: ${pkg.downloads} Recent DLs: ${pkg.recent_downloads}`,
        description: `(${pkg.max_version}) ${pkg.description}`,
    }));

    let selection: any = await vscode.window.showQuickPick(items);
    if (selection === undefined) {
        return;
    }

    let name = selection.label;

    console.log(`Adding dependency '${name}'`);
    await cargo.add(cwd, name).catch(logAndShowError);

    vscode.window.showInformationMessage(`Successfully added dependency '${name}'`);
}

export async function cargo_rm() {
    let cwd = util.getCwd();

    let name = await vscode.window.showInputBox();
    if (name === undefined) {
        return;
    }

    console.log(`Removing dependency '${name}'`);
    await cargo.rm(cwd, name).catch(logAndShowError);

    vscode.window.showInformationMessage(`Successfully removed dependency '${name}'`);
}
