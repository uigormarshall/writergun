import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { Command } from 'commander';
import chalk from 'chalk';

import { ensureDir, pathExists, readText, writeText } from '../lib/fs.js';
import { contextPath, publicationDir, resolveRoot } from '../lib/paths.js';

type GuideOptions = {
  overwrite: boolean;
};

function formatContextMd(params: {
  title: string;
  audience: string;
  goal: string;
  tone: string;
  bullets: string[];
  refs: string[];
  notes: string;
}): string {
  const bullets = params.bullets.filter(Boolean).map((b) => `- ${b}`).join('\n');
  const refs = params.refs.filter(Boolean).map((r) => `- ${r}`).join('\n');

  return `# Contexto

## Título provisório
${params.title}

## Público-alvo
${params.audience}

## Objetivo do post
${params.goal}

## Tom
${params.tone}

## Pontos principais (bullet points)
${bullets || '-'}

## Referências / links
${refs || '-'}

## Observações
${params.notes || '-'}
`;
}

async function askMultiline(rl: readline.Interface, prompt: string): Promise<string[]> {
  const lines: string[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const line = (await rl.question(prompt)).trim();
    if (!line) break;
    lines.push(line);
  }
  return lines;
}

export function registerGuideCommand(program: Command) {
  program
    .command('guide')
    .argument('<name>', 'nome da pasta da publicação')
    .option('--overwrite', 'sobrescrever context.md se já existir', false)
    .description('Assistente interativo para montar context.md (pt-BR)')
    .action(async (name: string, opts: GuideOptions, cmd: Command) => {
      const root = resolveRoot(cmd.parent?.opts() as { root: string });

      let pubDir: string;
      try {
        pubDir = publicationDir(root, name);
      } catch (err) {
        console.log(chalk.red(String(err)));
        return;
      }

      await ensureDir(pubDir);
      const ctxFile = contextPath(pubDir);

      if ((await pathExists(ctxFile)) && !opts.overwrite) {
        console.log(
          chalk.yellow(`Já existe ${chalk.bold(path.relative(process.cwd(), ctxFile))} (use --overwrite).`),
        );
        return;
      }

      const rl = readline.createInterface({ input, output });
      try {
        console.log(chalk.gray('Deixe em branco e aperte Enter para pular/encerrar listas.'));

        const title = (await rl.question('Título provisório: ')).trim() || name;
        const audience = (await rl.question('Público-alvo: ')).trim() || 'Leitor de blog';
        const goal = (await rl.question('Objetivo do post: ')).trim();
        const tone = (await rl.question('Tom (ex.: didático, direto, pt-BR): ')).trim() || 'Didático, direto, pt-BR.';

        const bullets = await askMultiline(rl, 'Bullet (Enter vazio para finalizar): ');
        const refs = await askMultiline(rl, 'Referência/link (Enter vazio para finalizar): ');
        const notes = (await rl.question('Observações/limitações (opcional): ')).trim();

        const md = formatContextMd({
          title,
          audience,
          goal,
          tone,
          bullets,
          refs,
          notes,
        });

        await writeText(ctxFile, md);
        console.log(chalk.green(`Gerado: ${chalk.bold(path.relative(process.cwd(), ctxFile))}`));
      } finally {
        rl.close();
      }

      // Mostra um resumo rápido do que foi escrito
      const preview = (await readText(ctxFile)).split('\n').slice(0, 12).join('\n');
      console.log(chalk.gray('\nPreview:'));
      console.log(preview);
    });
}

