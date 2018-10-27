module.exports = {

	// Watch & compile TypeScript if true
	tsc: true,

	// Watch & compile SCSS using command & args if true
	scss: true,

	// Which SCSS compiler to use. Sassc is faster but must be installed manually.
	scssCommand: (ifn, ofn) => ['sassc', [ifn, ofn]],
	// Or use a JS version
	// scssCommand: (ifn, ofn) => ['npx', ['sass', ifn, ofn]],

	// Run webpack --watch
	webpack: true,

	// Restart main process on out/server/ changes
	restart: false,

};
