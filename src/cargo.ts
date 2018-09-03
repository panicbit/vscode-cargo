import { exec } from './util';
import fetch from 'node-fetch';
const { parse_json_stream } = require('.././json-stream/target/wasm32-unknown-unknown/release/json_stream.js');

export interface Metadata {
    workspace_root: string;
}

export type Diagnostic = MessageDiagnostic | {};

export interface MessageDiagnostic {
    message: Message;
}

export interface Message {
    children: Message[];
    code: Code | null;
    level: Level;
    message: string;
    rendered: string | null;
    spans: Span[];
}

export interface Code {
    code: string;
    explanation: string;
}

export enum Level {
    Error = "error",
    Help = "help",
    Note = "note",
    Warning = "warning",
}

export interface Span {
    file_name: string;
    line_end: number;
    line_start: number;
    column_start: number;
    column_end: number;
    byte_end: number;
    byte_start: number;
    is_primary: boolean;
    label: string | null;
    // expansion: ???
    // suggested_replacement: ???
    // text: …
}

export async function metadata(cwd: string): Promise<Metadata> {
    let output = await exec('cargo', ['metadata', '--no-deps', '--format-version=1'], { cwd });

    if (output.code !== 0) {
        throw new Error(`cargo build: ${output.stderr}`);
    }

    return JSON.parse(output.stdout);
}

export async function build(cwd: string): Promise<Diagnostic[]> {
    let output = await exec('cargo', ['build', '--message-format=json'], { cwd });

    if (output.code !== 0 && output.stdout === "") {
        throw new Error(`cargo build: ${output.stderr}`);
    }

    return parse_json_stream(output.stdout);
}

export async function check(cwd: string): Promise<Diagnostic[]> {
    let output = await exec('cargo', ['check', '--message-format=json', '--all-targets'], { cwd });

    if (output.code !== 0 && output.stdout === "") {
        throw new Error(`cargo check: ${output.stderr}`);
    }

    return parse_json_stream(output.stdout);
}

export async function add(cwd: string, pkg: string) {
    let { code, stderr } = await exec('cargo', ['add', '--', pkg], { cwd });

    if (code !== 0) {
        console.error(stderr);
        throw Error("`cargo add` returned with non-zero exit code");
    }
}

export async function rm(cwd: string, pkg: string) {
    let { code, stderr } = await exec('cargo', ['rm', '--', pkg], { cwd });

    if (code !== 0) {
        console.error(stderr);
        throw Error("`cargo rm` returned with non-zero exit code");
    }
}

export async function search(name: string): Promise<Package[]> {
    let response = await fetch(`https://crates.io/api/v1/crates?per_page=20&q=${name}`);
    let json: { crates: Package[] } = await response.json();

    return json.crates;
}

export interface Package {
    name: string;
    description: string;
    max_version: string;
    downloads: number;
    recent_downloads: number;
}
