import * as path from 'path';
import * as util from 'util';
import * as glob from 'glob';

const pglob = util.promisify(glob);

import { debounce, readConfig, spawn, watch } from './impl';

process.chdir(path.resolve(__dirname, '../..'));

const config = readConfig<{
	tsc: boolean;
	scss: boolean;
	webpack: boolean;
	restart: boolean;
	scssCommand: (ifn: string, ofn: string) => [string, string[]];
}>(__dirname);
console.log(JSON.stringify(config));

if (config.webpack) spawn('npx', ['webpack', '--watch'], { tag: 'webpack' });

if (config.tsc) {
	for (let dir of ['server', 'web']) {
		spawn('npx', ['tsc', '--watch'], { tag: 'tsc:' + dir, cwd: 'src/' + dir });
	}
}

const rehash = debounce(() => spawn('node', ['out/server/server/script.js', 'updateHashes'], { tag: 'updateHashes', once: true }));

const main = config.restart && spawn('node', ['out/server/server/server.js'], { tag: 'server' });
const restart = main && debounce(() => main.restart());

const changed = () => rehash().then(restart && restart || null);

if (restart) {
	watch('out/server', changed);
	watch('out/client', changed, { ignored: '**/hashes.json' });
}

const scss = async () => {
	for (let fn of await pglob('scss/*.scss')) {
		if (path.basename(fn).match(/^_/)) continue;
		const ofn = 'out/client/' + path.relative('scss', fn.replace(/\.scss$/, '.css'));
		const [cmd, args] = config.scssCommand(fn, ofn);
		await spawn(cmd, args, { tag: 'scss:' + fn, once: true }).promise;
	}
};

if (config.scss) {
	scss();
	watch('scss', debounce(scss));
}
