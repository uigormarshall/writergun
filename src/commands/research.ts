import path from 'node:path';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import { pathExists, readText, writeText } from '../lib/fs.js';
import { extractTitleFromContext } from '../lib/context.js';
import { contextPath, publicationDir, researchPath, resolveRoot } from '../lib/paths.js';
import { formatResearchMd } from '../lib/research.js';
import { webSearch } from '../lib/web.js';

type ResearchOptions = {
  query?: string;
  maxResults: number;
  timeoutMs: number;
  host?: string;
  overwrite: boolean;
};

export function registerResearchCommand(program: Command) {
  const envMax = Number(process.env.WRITERGUN_WEB_MAX_RESULTS ?? 5);
  const envTimeout = Number(process.env.WRITERGUN_WEB_TIMEOUT_MS ?? 30_000);

  program
    .command('research')
    .argument('<name>', 'nome da pasta da publicação')
    .option('-q, --query <query>', 'query de busca (default: inferida do context.md)')
    .option('--max-results <n>', `máximo de resultados (default: ${envMax})`, (v) => Number(v), envMax)
    .option('--timeout-ms <n>', `timeout do webSearch (default: ${envTimeout})`, (v) => Number(v), envTimeout)
    .option('--host <url>', 'host do Ollama (default: http://127.0.0.1:11434)')
    .option('--overwrite', 'sobrescrever research.md se já existir', false)
    .description('Busca na web e salva research.md para enriquecer o contexto')
    .action(async (name: string, opts: ResearchOptions, cmd: Command) => {
      const root = resolveRoot(cmd.parent?.opts() as { root: string });
      let pubDir: string;
      try {
        pubDir = publicationDir(root, name);
      } catch (err) {
        console.log(chalk.red(String(err)));
        return;
      }
      const ctxFile = contextPath(pubDir);
      const outFile = researchPath(pubDir);

      const rel = (p: string) => chalk.bold(path.relative(process.cwd(), p));

      if (!(await pathExists(ctxFile))) {
        console.log(chalk.red(`Faltando ${rel(ctxFile)}.`));
        return;
      }

      if ((await pathExists(outFile)) && !opts.overwrite) {
        console.log(chalk.yellow(`Já existe ${rel(outFile)} (use --overwrite para sobrescrever).`));
        return;
      }

      const ctx = await readText(ctxFile);
      const inferredTitle = extractTitleFromContext(ctx);
      const query = (opts.query ?? inferredTitle ?? name).trim();

      const spinner = ora(`Buscando na web: ${chalk.cyan(query)}`).start();
      try {
        const results = await webSearch({
          host: opts.host,
          query,
          maxResults: opts.maxResults,
          timeoutMs: opts.timeoutMs,
        });

        if (results.length === 0) {
          spinner.fail('Sem resultados.');
          return;
        }

        await writeText(outFile, formatResearchMd(query, results));
        spinner.succeed(`Gerado: ${rel(outFile)}`);
      } catch (err) {
        spinner.fail('Falha no webSearch.');
        console.log(chalk.gray(String(err)));
      }
    });
}

