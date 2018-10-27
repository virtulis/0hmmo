import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { ResourceHashes } from '../lib/config';

export = async function (...args: any[]) {

	const dir = 'out/client';

	const hashes: ResourceHashes = {};
	const files = readdirSync(dir);
	files.sort();

	for (let fn of files) {
		if (fn == '.hashes.json') continue;
		const buf = readFileSync(`${dir}/${fn}`);
		hashes[fn] = createHash('sha1').update(buf).digest('hex');
	}

	writeFileSync(`${dir}/hashes.json`, JSON.stringify(hashes, null, '\t'));

}
