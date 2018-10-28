import { startGameServer } from './lib/gameserver';

(require('source-map-support') as any).install();

import * as http from 'http';
import { promisify } from 'util';
import { parse as parseUrl } from 'url';
import { resolve } from 'path';
import { exists as _exists, stat as _stat, realpath as _realpath, createReadStream } from 'fs';
import { getType } from 'mime';
import { ujsxToHTML } from 'ujsx';

import { config } from './lib/config';
import { createOuter } from './templates/outer';

const exists = promisify(_exists);
const stat = promisify(_stat);
const realpath = promisify(_realpath);

process.chdir(resolve(__dirname, '../../..'));

const outDir = 'out/client';

async function maybeServe(fn: string, res: http.ServerResponse) {

	const rod = await realpath(outDir);
	const rfn = await realpath(resolve(outDir, fn));
	if (
		(rfn.substr(0, rod.length + 1) != rod + '/')
		|| (!await exists(rfn))
		|| (await stat(rfn)).isDirectory()
	) return false;

	const type = getType(rfn) || 'application/octet-stream';
	res.setHeader('Content-Type', type + (type.match(/^(text|application)/) ? '; charset=utf-8' : ''));
	res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

	createReadStream(rfn).pipe(res);

	return true;

}

const httpd = http.createServer(async (request, response) => {

	try {

		const parsed = parseUrl(request.url || '/');

		if (parsed.pathname == '/') {
			response.statusCode = 200;
			response.setHeader('Content-Type', 'text/html; charset=utf-8');
			response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
			response.end('<!DOCTYPE html>\n' + ujsxToHTML(createOuter()));
			return;
		}

		const trurl = (parsed.pathname || '/').replace(/\.\.+/g, '.').replace(/\/+$/, '').replace(/![0-9a-f]+(\.\w+)$/, '$1');

		if (trurl && await maybeServe(trurl.substr('/client/'.length), response)) return;

		response.statusCode = 404;
		response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
		response.end('What.');

	}
	catch (e) {

		console.log(e.stack);

		response.statusCode = 500;
		response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
		response.end('What!!');

	}

});

startGameServer(httpd);

httpd.listen(config.gamePort, config.host);
