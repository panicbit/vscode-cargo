import { exec } from './util';
import fetch from 'node-fetch';

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
    let response = await fetch(`https://crates.io/api/v1/crates?per_page=20&q=${name}`, {
        headers: {
            "user-agent": "vscode-cargo (github.com/panicbit/vscode-cargo)"
        }
    });
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
