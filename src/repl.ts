import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import chalk from 'chalk';

import { run } from './cli.js';
import { ensureDir, pathExists, readText, writeText } from './lib/fs.js';
import { contextPath, publicationDir, resolveRoot } from './lib/paths.js';

type SlashCommand = {
  name: string;
  usage: string;
  description: string;
};

const SLASH_COMMANDS: SlashCommand[] = [
  { name: '/', usage: '/ (ou /help)', description: 'lista comandos disponíveis' },
  { name: 'help', usage: '/help [cmd]', description: 'mostra ajuda (ou de um comando)' },
  { name: 'list', usage: '/list', description: 'lista targets e status' },
  { name: 'aim', usage: '/aim <name>', description: 'cria target + context.md' },
  { name: 'guide', usage: '/guide <name>', description: 'assistente interativo para context.md' },
  { name: 'research', usage: '/research <name> [--overwrite]', description: 'gera research.md' },
  { name: 'shot', usage: '/shot <name> [--web]', description: 'gera draft.md e final.md' },
  { name: 'clean', usage: '/clean <name>', description: 'remove draft.md e final.md' },
  { name: 'root', usage: '/root <dir>', description: 'define root da sessão (equivale a --root)' },
  { name: 'exit', usage: '/exit', description: 'sai do modo interativo' },
];

const BANNER = `██     ██ ██████  ██ ████████ ███████ ██████   ██████  ██    ██ ███    ██
██     ██ ██   ██ ██    ██    ██      ██   ██ ██       ██    ██ ████   ██
██  █  ██ ██████  ██    ██    █████   ██████  ██   ███ ██    ██ ██ ██  ██
██ ███ ██ ██   ██ ██    ██    ██      ██   ██ ██    ██ ██    ██ ██  ██ ██
 ███ ███  ██   ██ ██    ██    ███████ ██   ██  ██████   ██████  ██   ████`;

function shouldShowBanner(): boolean {
  const v = (process.env.WRITERGUN_BANNER ?? '1').toLowerCase();
  return v !== '0' && v !== 'false' && v !== 'no';
}

function printSlashHelp() {
  console.log(chalk.bold('\nComandos (/):'));
  for (const c of SLASH_COMMANDS) {
    console.log(`- ${chalk.cyan(c.usage)}  ${chalk.gray(c.description)}`);
  }
  console.log(chalk.gray('\nDica: texto sem "/" vira um pedido para montar/atualizar context.md.'));
}

function splitArgs(inputLine: string): string[] {
  // Parser simples (aspas duplas)
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < inputLine.length; i++) {
    const ch = inputLine[i]!;
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && /\s/.test(ch)) {
      if (cur) out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

async function upsertContextFromFreeform(root: string, rl: readline.Interface, freeform: string) {
  const name = (await rl.question('Qual target? (ex.: r36s-clone) ')).trim();
  if (!name) return;

  let pubDir: string;
  try {
    pubDir = publicationDir(root, name);
  } catch (err) {
    console.log(chalk.red(String(err)));
    return;
  }

  await ensureDir(pubDir);
  const ctxFile = contextPath(pubDir);

  const title = (await rl.question('Título provisório (enter pra pular): ')).trim();
  const audience = (await rl.question('Público-alvo (enter pra pular): ')).trim();

  const addition = [
    '\n',
    '---',
    '',
    '## Nota (capturada no modo interativo)',
    title ? `- **Título provisório:** ${title}` : undefined,
    audience ? `- **Público-alvo:** ${audience}` : undefined,
    '',
    freeform.trim(),
    '',
  ]
    .filter(Boolean)
    .join('\n');

  if (await pathExists(ctxFile)) {
    const existing = await readText(ctxFile);
    await writeText(ctxFile, `${existing.trimEnd()}\n${addition}`);
    console.log(chalk.green(`Atualizado: ${chalk.bold(path.relative(process.cwd(), ctxFile))}`));
  } else {
    const md = `# Contexto\n\n## Observações\n${freeform.trim()}\n`;
    await writeText(ctxFile, md);
    console.log(chalk.green(`Criado: ${chalk.bold(path.relative(process.cwd(), ctxFile))}`));
  }
}

export async function startRepl(initialRoot?: string) {
  const rl = readline.createInterface({ input, output });
  let root = resolveRoot({ root: initialRoot ?? process.env.WRITERGUN_ROOT ?? 'targets' });

  if (shouldShowBanner()) {
    console.log(BANNER);
    console.log();
  }
  console.log(chalk.bold('Writergun (interactive)'));
  console.log(chalk.gray(`Root: ${root}`));
  console.log(chalk.gray('Digite "/" para ver comandos. /exit para sair.\n'));

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const line = (await rl.question(chalk.cyan('writergun> '))).trim();
      if (!line) continue;

      if (!line.startsWith('/')) {
        await upsertContextFromFreeform(root, rl, line);
        continue;
      }

      const raw = line.slice(1).trim();
      if (!raw || raw === 'help' || raw === '?') {
        printSlashHelp();
        continue;
      }
      if (raw === 'exit' || raw === 'quit') return;

      const argvParts = splitArgs(raw);
      const cmd = argvParts[0]!;

      if (cmd === '/') {
        printSlashHelp();
        continue;
      }

      if (cmd === 'root') {
        const next = argvParts.slice(1).join(' ').trim();
        if (!next) {
          console.log(chalk.gray(`Root atual: ${root}`));
          continue;
        }
        root = resolveRoot({ root: next });
        console.log(chalk.gray(`Root atualizado: ${root}`));
        continue;
      }

      // Dispatch para a CLI existente, sempre passando o root atual.
      const argv = ['node', 'writergun', '--root', root, ...argvParts];
      try {
        await run(argv);
      } catch (err) {
        console.log(chalk.red(String(err)));
      }
    }
  } finally {
    rl.close();
  }
}

