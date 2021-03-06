/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
const fs = require('fs');
const readline = require('readline');
const util = require('util');
const Lexer = require('./src/front/lexer.js');
const Parser = require('./src/front/parser.js');
const Machine = require('./src/interpreter/interpreter.js');
const { SyntaxError } = require('./src/errors.js');

function executeFile(file) {
  let code;
  try {
    code = fs.readFileSync(file).toString('utf-8');
  } catch (err) {
    process.stdout.write('File not found\n');
    return;
  }

  const lexer = new Lexer(code);
  const parser = new Parser(lexer);
  const machine = new Machine();

  try {
    machine.run(parser.parse());
  } catch (err) {
    process.stdout.write(util.inspect(err, false, 3, true));
  }
}

async function repl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });

  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  const machine = new Machine();

  process.stdout.write("Repl de Ednaldo use ':quit' to quit!\n\n");

  rl.prompt();

  let join = '';
  let joining = false;

  for await (const line of rl) {
    if (line.trim() === ':quit') {
      rl.close();
      return;
    }
    const lexer = new Lexer(joining ? join + line.trim() : line.trim());
    const parser = new Parser(lexer);
    try {
      const val = machine.run(parser.parse());
      if (val !== null) {
        join = '';
        joining = false;
        machine.builtIn.println.run(machine, val);
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        if (err.got === 'EOF') {
          process.stdout.write('.. ');
          joining = true;
          join += `${line}\n`;
          continue;
        }
      }
      join = '';
      joining = false;
      process.stdout.write(`${util.inspect(err, false, 3, true)}\n`);
    }

    rl.prompt();
  }
}

if (process.argv.length > 2) {
  executeFile(process.argv[2]);
} else {
  repl();
}
