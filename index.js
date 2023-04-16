#!/usr/bin/env node

const greet = (name) => {
  console.log(`Hello, ${name}!`);
};

const args = process.argv.slice(2);
const name = args[0] || "World";

greet(name);
