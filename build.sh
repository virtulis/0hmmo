#!/usr/bin/env bash

npm install

pushd dev/watch
npx tsc
popd

pushd src/server
npx tsc
popd

pushd src/web
npx tsc
popd

npx webpack --mode production

sassc scss/game.scss out/client/game.css

node out/server/server/script.js updateHashes
