'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as cargo from './cargo';
import * as util from './util';
import { logAndShowError } from './util';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
    const rust_diagnostics = vscode.languages.createDiagnosticCollection("rust");
    context.subscriptions.push(rust_diagnostics);

    vscode.workspace.onDidSaveTextDocument((document) => {
        vscode.commands.executeCommand("cargo.check");
    });

    context.subscriptions.push(
        vscode.commands.registerCommand('cargo.check', async () => with_cargo_diagnostics(rust_diagnostics, 'cargo check', cargo.check))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('cargo.build', async () => with_cargo_diagnostics(rust_diagnostics, 'cargo build', cargo.build))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('cargo.add', async () => {
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

            vscode.commands.executeCommand("cargo.check");
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('cargo.rm', async () => {
            let cwd = util.getCwd();

            let name = await vscode.window.showInputBox();
            if (name === undefined) {
                return;
            }

            console.log(`Removing dependency '${name}'`);
            await cargo.rm(cwd, name).catch(logAndShowError);

            vscode.window.showInformationMessage(`Successfully removed dependency '${name}'`);

            vscode.commands.executeCommand("cargo.check");
        })
    );

    vscode.commands.executeCommand("cargo.check");
}

async function with_cargo_diagnostics(rust_diagnostics: vscode.DiagnosticCollection, name: string, command: (cwd: string) => Promise<cargo.Diagnostic[]>) {
    const cwd = util.getCwd();

    rust_diagnostics.clear();

    let diagnosis = new Diagnosis;

    let progressOptions = { location: vscode.ProgressLocation.Window };
    await vscode.window.withProgress(progressOptions, async (progress) => {
        progress.report({ message: "Running 'cargo metadata'" });
        let metadata = await cargo.metadata(cwd);
        let workspaceRoot = metadata.workspace_root;

        progress.report({ message: `Running '${name}'` });
        let diagnostics = await command(cwd);

        progress.report({ message: "Processing build messages" });
        diagnosis.add_cargo_diagnostics(workspaceRoot, diagnostics);

        diagnosis.finish(rust_diagnostics);
    });
}

class Diagnosis {
    diagnostics: Map<string, vscode.Diagnostic[]> = new Map();

    add(path: string, diagnostic: vscode.Diagnostic) {
        if (!this.diagnostics.has(path)) {
            this.diagnostics.set(path, []);
        }

        this.diagnostics.get(path)!.push(diagnostic);
    }

    add_cargo_diagnostics(workspaceRoot: string, diagnostics: cargo.Diagnostic[]) {
        diagnostics
            .filter((diag) => (<cargo.MessageDiagnostic>diag).message !== undefined)
            .map((diag) => <cargo.MessageDiagnostic>diag)
            .forEach((diag) => {
                diag.message.spans.forEach((span) => {
                    console.log(diag);

                    let range = new vscode.Range(
                        span.line_start - 1,
                        span.column_start - 1,
                        span.line_end - 1,
                        span.column_end - 1,
                    );

                    this.add_cargo_message(workspaceRoot, range, span, diag.message);
                });
            });
    }

    add_cargo_message(workspaceRoot: string, range: vscode.Range, span: cargo.Span, message: cargo.Message) {
        var level = (() => {
            switch (message.level) {
                case cargo.Level.Error: return vscode.DiagnosticSeverity.Error;
                case cargo.Level.Note: return vscode.DiagnosticSeverity.Information;
                case cargo.Level.Help: return vscode.DiagnosticSeverity.Hint;
                case cargo.Level.Warning: return vscode.DiagnosticSeverity.Warning;
                default: return vscode.DiagnosticSeverity.Error;
            }
        })();

        let formatted_message = `${message.level}: ${message.message}`;

        if (span.label) {
            formatted_message += `\nlabel: ${span.label}`;
        }

        let diagnostic = new vscode.Diagnostic(
            range,
            formatted_message,
            level
        );
        let file_path = path.join(workspaceRoot, span.file_name);

        this.add(file_path, diagnostic);

        for (let child of message.children) {
            this.add_cargo_message(workspaceRoot, range, span, child);
        }
    }

    finish(diagnostics: vscode.DiagnosticCollection) {
        for (let [path, file_diagnostic] of this.diagnostics.entries()) {
            const uri = vscode.Uri.file(path);

            diagnostics.set(uri, file_diagnostic);
        }
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}