import { existsSync, readFileSync } from 'fs';
import chalk from 'chalk';
import { parse as parsePath } from "path";

export interface Config {

	webPort: number;
	gamePort: number;
	host: string;

}

const cfn = process.cwd() + '/config.js';
const cfb = process.cwd() + '/config.example.js';

const haveConfig = existsSync(cfn);
if (!haveConfig) console.error(chalk.red('config.js not found, using config.example.js'));

export const config = require(haveConfig ? cfn : cfb) as Config;

export type ResourceHashes = Record<string, string>;

const rhfn = 'out/client/hashes.json';
export const resourceHashes: ResourceHashes = existsSync(rhfn) ? JSON.parse(readFileSync(rhfn, 'utf8')) : {};

export function resourceLink(rfn: string) {
	const pp = parsePath(rfn);
	return '/client/' + pp.name + '!' + (resourceHashes[rfn] || '00000000').substr(0, 8) + pp.ext;
}
