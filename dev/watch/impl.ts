import * as child_process from 'child_process';
import * as stream from 'stream';
import * as os from 'os';
import * as fs from 'fs';
import { resolve } from 'path';

import * as chokidar from 'chokidar';
import * as dayjs from 'dayjs';
import chalk from 'chalk';

type Timeout = ReturnType<typeof setTimeout>;

function getPromiseLike(res: any): PromiseLike<any> | void {
	if (!res) return;
	if (typeof res.then == 'function') return res;
	if (res.promise && typeof res.promise.then == 'function') return res.promise;
}

export function debounce<R = any>(fun: () => PromiseLike<R> | R | { promise: PromiseLike<R> }, t: number = 500) {

	let to: Timeout | null = null;
	let running = false, requested = false;
	let promise: PromiseLike<R> | null = null;
	let resolve: (r: any) => void = () => {};
	
	const run = () => {
		
		to = null;
		
		if (running) {
			requested = true;
			return;
		}
		
		const res = fun();
		const p = getPromiseLike(res);
		
		if (!p) {
			promise = null;
			return resolve(res);
		}

		running = true;
		p.then(r => {
			running = false;
			if (requested) setTimeout(run, 0);
			requested = false;
			promise = null;
			resolve(r);
		});

	};
	
	return () => {
		if (!promise) promise = new Promise<R>(rcb => resolve = rcb);
		if (to) clearTimeout(to);
		if (!requested) to = setTimeout(run, t);
		return promise;
	}
	
}

export function readConfig<T>(dir: string) {

	const cfn = resolve(dir, 'config.js');
	const cfb = resolve(dir, 'config.example.js');

	const haveConfig = fs.existsSync(cfn);
	if (!haveConfig) console.error(chalk.red('config.js not found, using config.example.js'));

	return require(haveConfig ? cfn : cfb) as T;

}

export interface SpawnOptions {
	tag?: string;
	once?: boolean;
	restartTimeout?: number;
	killTimeout?: number;
}

const tpfx = () => dayjs().format('HH:mm:ss') + ' ';

const win = os.platform() === 'win32';

export function bufferStdio(tag: string, stream: stream.Readable) {
	let pbuf: Buffer | null = null;
	let p = 0;
	stream.on('data', (buf: Buffer) => {
		let ss = 0;
		for (let i = 0, l = buf.length; i < l; i++) {
			const b = buf[i];
			if (b == 13 || (b == 10 && p != 13)) {
				const slice = buf.slice(ss, i);
				ss = i + (b == 13 && buf[i + 1] == 10 ? 2 : 1);
				const lbuf = pbuf ? Buffer.concat([pbuf, slice]) : slice;
				pbuf = null;
				const str = lbuf.toString('utf-8').replace(/^\x1bc/, '');
				console.log(tpfx() + tag + ' ' + str);
			}
			p = b;
		}
		if (ss < buf.length) pbuf = buf.slice(ss);
	});
}

const spawned = new Set<child_process.ChildProcess>();

export function spawn(command: string, args: string[], options?: child_process.SpawnOptions & SpawnOptions) {
	
	const opts = options || {};
	const tag = opts.tag || command;
	const rto = typeof opts.restartTimeout === 'number' ? opts.restartTimeout : 500;
	const kto = typeof opts.killTimeout === 'number' ? opts.killTimeout : 1000;
	
	let cp: child_process.ChildProcess | null = null;
	let forced = false;
	
	let promise: Promise<number> = new Promise<number>(resolve => resolve(0));
	let resolver: ((code: number) => void) | null = null;
	
	const start = () => {
		
		forced = false;
		console.log(tpfx() + chalk.green.bold(tag) + ' ' + chalk.green(command + ' ' + args.map(a => `"${a}"`).join(' ')));
		
		cp = child_process.spawn(command, args, options);
		bufferStdio(chalk.bold(tag), cp.stdout);
		bufferStdio(chalk.bold.red(tag), cp.stderr);
		
		spawned.add(cp);
		
		if (opts.once) promise = new Promise<number>(resolve => resolver = resolve);
		
		const ccp = cp;
		cp.on('exit', code => {
			
			if (cp != ccp) throw new Error('Something weird happened');
			
			cp = null;
			spawned.delete(ccp);
			
			if (opts.once && !forced) {
				const color = code ? chalk.red : chalk.reset;
				console.log(tpfx() + color.bold(tag) + color(' exited with code ') + color.bold('' + code));
				resolver!(code);
				return;
			}
			
			if (!forced) console.log(tpfx() + chalk.bold.red(tag) + chalk.red(' exited with code ') + chalk.bold.red('' + code));
			
			if (forced) start();
			else setTimeout(start, rto);
			
		})
		
	};
	
	const restart = () => {

		if (!cp && opts.once) return start();

		console.log(tpfx() + chalk.bold.magenta(tag) + ' forced restart');
		forced = true;
		if (!cp) return;
		const pcp = cp;
		cp.kill('SIGTERM');
		setTimeout(() => {
			if (pcp != cp) return;
			console.log(tpfx() + chalk.bold.magenta(tag) + ' killing');
			kill(cp);
		}, kto);
	};
	
	const get = () => cp;
	
	start();
	
	return { restart, get, promise };
	
}

export function watch(dir: string, handler: (filename: string) => void, options: chokidar.WatchOptions = {}) {
	options.ignoreInitial = true;
	chokidar.watch(dir, options).on('change', (filename: string) => {
		console.log(tpfx() + chalk.bold(dir) + ' changed ' + chalk.bold(filename));
		handler(filename);
	});
}

function kill(cp: child_process.ChildProcess) {
	if (win) child_process.exec('taskkill /pid ' + cp.pid + ' /T /F');
	else cp.kill('SIGKILL');
}

process.on('exit', code => {
	spawned.forEach(kill);
});
