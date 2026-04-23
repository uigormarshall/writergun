import { Command } from 'commander';
import chalk from 'chalk';
import dotenv from 'dotenv';

import { registerAimCommand } from './commands/aim.js';
import { registerCleanCommand } from './commands/clean.js';
import { registerListCommand } from './commands/list.js';
import { registerResearchCommand } from './commands/research.js';
import { registerShotCommand } from './commands/shot.js';
import { registerGuideCommand } from './commands/guide.js';
import { log } from './lib/logger.js';

export async function run(argv: string[]) {
  // Carrega .env do diretório atual (opcional).
  dotenv.config();

  const program = new Command();

  program
    .name('writergun')
    .description('CLI para criar posts em Markdown usando Ollama (modelos locais).')
    .version('0.1.0')
    .option(
      '-r, --root <dir>',
      'pasta raiz onde ficam os targets (default: ./targets)',
      process.env.WRITERGUN_ROOT ?? 'targets',
    )
    .option('-i, --interactive', 'abrir modo interativo (REPL)', false)
    .showHelpAfterError(true)
    .configureHelp({
      subcommandTerm: (cmd) => chalk.cyan(cmd.name()),
    });

  program.hook('preAction', (thisCommand, actionCommand) => {
    log('info', 'cli.command', actionCommand.name() ?? 'root', {
      argv: argv.slice(2),
      cwd: process.cwd(),
      root: (thisCommand.opts() as { root?: string }).root,
    });
  });

  registerListCommand(program);
  registerAimCommand(program);
  registerShotCommand(program);
  registerResearchCommand(program);
  registerGuideCommand(program);
  registerCleanCommand(program);

  await program.parseAsync(argv);
}

