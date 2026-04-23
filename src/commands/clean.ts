import path from 'node:path';
import { Command } from 'commander';
import chalk from 'chalk';

import { removeIfExists } from '../lib/fs.js';
import { draftPath, finalPath, publicationDir, resolveRoot } from '../lib/paths.js';

export function registerCleanCommand(program: Command) {
  program
    .command('clean')
    .argument('<name>', 'nome da pasta da publicação')
    .description('Remove draft.md e final.md para reiniciar um "tiro"')
    .action(async (name: string, _opts: unknown, cmd: Command) => {
      const root = resolveRoot(cmd.parent?.opts() as { root: string });
      let pubDir: string;
      try {
        pubDir = publicationDir(root, name);
      } catch (err) {
        console.log(chalk.red(String(err)));
        return;
      }
      const draft = draftPath(pubDir);
      const final = finalPath(pubDir);

      const removedDraft = await removeIfExists(draft);
      const removedFinal = await removeIfExists(final);

      if (!removedDraft && !removedFinal) {
        console.log(chalk.gray('Nada para limpar.'));
        return;
      }

      if (removedDraft) console.log(chalk.green(`Removido: ${chalk.bold(path.relative(process.cwd(), draft))}`));
      if (removedFinal) console.log(chalk.green(`Removido: ${chalk.bold(path.relative(process.cwd(), final))}`));
    });
}

