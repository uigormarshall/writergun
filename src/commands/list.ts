import fs from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import Table from 'cli-table3';
import chalk from 'chalk';

import { publicationDir, resolveRoot } from '../lib/paths.js';
import { getPublicationStatus, type PublicationStatus } from '../lib/status.js';

function colorStatus(status: PublicationStatus): string {
  switch (status) {
    case 'FINAL':
      return chalk.green(status);
    case 'DRAFT':
      return chalk.yellow(status);
    case 'PENDENTE':
      return chalk.cyan(status);
    default:
      return chalk.gray(status);
  }
}

export function registerListCommand(program: Command) {
  program
    .command('list')
    .description('Lista publicações, status e data de modificação')
    .action(async (_opts: unknown, cmd: Command) => {
      const root = resolveRoot(cmd.parent?.opts() as { root: string });

      let entries: Dirent[];
      try {
        entries = await fs.readdir(root, { withFileTypes: true });
      } catch {
        console.log(
          chalk.yellow(
            `Pasta raiz não encontrada: ${chalk.bold(path.relative(process.cwd(), root))}. Crie-a ou use --root.`,
          ),
        );
        return;
      }

      const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
      const rows: Array<[string, string, string]> = [];

      for (const name of dirs) {
        let dir: string;
        try {
          dir = publicationDir(root, name);
        } catch {
          continue;
        }
        const status = await getPublicationStatus(dir);
        if (status === 'VAZIO') continue;

        const stat = await fs.stat(dir);
        rows.push([name, colorStatus(status), stat.mtime.toISOString().slice(0, 19).replace('T', ' ')]);
      }

      if (rows.length === 0) {
        console.log(chalk.gray('Nenhuma publicação encontrada.'));
        return;
      }

      const table = new Table({
        head: [chalk.bold('Publicação'), chalk.bold('Status'), chalk.bold('Modificado')],
        colWidths: [40, 12, 22],
        wordWrap: true,
      });

      table.push(...rows);
      console.log(table.toString());
    });
}

