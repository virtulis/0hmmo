#!/usr/bin/env bash
pushd dev/watch
npx tsc
node watch
popd
