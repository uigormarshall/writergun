#!/usr/bin/env node
import { run } from './cli.js';
import { startRepl } from './repl.js';

async function main() {
  const args = process.argv.slice(2);
  const wantsInteractive = args.length === 0 || args.includes('--interactive') || args.includes('-i');

  if (wantsInteractive) {
    await startRepl(process.env.WRITERGUN_ROOT);
  } else {
    await run(process.argv);
  }
}

main().catch((err) => {
  // Mantém erro visível e um exit code não-zero
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

