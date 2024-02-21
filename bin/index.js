#!/usr/bin/env node
const arg = process.argv.slice(2);

const { print } = require("../lib/utils/utils.js");

skipFolder = [];
let index = arg.findIndex((a) => a === "--skip-dir");
skipFolder = arg.slice(index + 1);
let path = arg[0] || ".";

async function init() {
  await print(path, skipFolder);
}

init();
