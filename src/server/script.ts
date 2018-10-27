(async function () {

	const argv = process.argv;

	const fun = await import('./scripts/' + argv[2]);

	await fun.apply(void 0, argv.slice(3));

	process.exit(0);

})();
