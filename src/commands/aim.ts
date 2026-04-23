import path from 'node:path';
import { Command } from 'commander';
import chalk from 'chalk';

import { ensureDir, pathExists, writeText } from '../lib/fs.js';
import { contextPath, publicationDir, resolveRoot } from '../lib/paths.js';

const DEFAULT_TEMPLATE = `# Contexto

## Título provisório

## Público-alvo

## Objetivo do post

## Pontos principais (bullet points)

## Referências / links

## Observações
`;

export function registerAimCommand(program: Command) {
  program
    .command('aim')
    .argument('<name>', 'nome da pasta da publicação')
    .option('-f, --force', 'sobrescrever context.md se já existir', false)
    .description('Cria a pasta do projeto e um template de context.md')
    .action(async (name: string, opts: { force: boolean }, cmd: Command) => {
      const root = resolveRoot(cmd.parent?.opts() as { root: string });
      let pubDir: string;
      try {
        pubDir = publicationDir(root, name);
      } catch (err) {
        console.log(chalk.red(String(err)));
        return;
      }
      const ctxPath = contextPath(pubDir);

      await ensureDir(pubDir);

      const exists = await pathExists(ctxPath);
      if (exists && !opts.force) {
        // Pasta pode ter sido criada, mas não sobrescrevemos o contexto.
        console.log(
          chalk.yellow(
            `context.md já existe em ${chalk.bold(path.relative(process.cwd(), ctxPath))} (use --force para sobrescrever)`,
          ),
        );
        return;
      }

      await writeText(ctxPath, DEFAULT_TEMPLATE);
      console.log(chalk.green(`Criado: ${chalk.bold(path.relative(process.cwd(), ctxPath))}`));
    });
}

