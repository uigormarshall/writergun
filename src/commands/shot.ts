import fs from 'node:fs/promises';
import path from 'node:path';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import { pathExists, readText, writeText } from '../lib/fs.js';
import { extractTitleFromContext } from '../lib/context.js';
import { generateText } from '../lib/ollama.js';
import { contextPath, draftPath, finalPath, publicationDir, researchPath, researchPtPath, resolveRoot } from '../lib/paths.js';
import { webSearch } from '../lib/web.js';
import { log } from '../lib/logger.js';
import { formatResearchMd } from '../lib/research.js';

type ShotOptions = {
  all: boolean;
  model: string;
  numCtx: number;
  tempWrite: number;
  tempReview: number;
  host?: string;
  timeoutMs: number;
  web: boolean;
  webMaxResults: number;
  webTimeoutMs: number;
};

function parseNumberOption(name: string, value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`Valor inválido para ${name}: ${value}`);
  }
  return n;
}

function parsePositiveInt(name: string, value: string): number {
  const n = parseNumberOption(name, value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`Valor inválido para ${name}: ${value} (use um inteiro > 0)`);
  }
  return n;
}

function parseNonNegativeInt(name: string, value: string): number {
  const n = parseNumberOption(name, value);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`Valor inválido para ${name}: ${value} (use um inteiro >= 0)`);
  }
  return n;
}

function parseProbability(name: string, value: string): number {
  const n = parseNumberOption(name, value);
  if (n < 0 || n > 2) {
    throw new Error(`Valor inválido para ${name}: ${value} (esperado entre 0 e 2)`);
  }
  return n;
}

function resolveOutputLocale(): string {
  return (process.env.WRITERGUN_LOCALE ?? process.env.WRITERGUN_LANG ?? 'pt-BR').trim() || 'pt-BR';
}

function localeInstruction(locale: string): string {
  return [
    `Idioma obrigatório de TODO o texto (título, corpo, listas, citações adaptadas): ${locale}.`,
    'Não use outro idioma, exceto termos técnicos inevitáveis (mantenha e explique brevemente se necessário).',
    `You MUST write the entire output in ${locale} (Brazilian Portuguese). Do not write in English.`,
  ].join(' ');
}

function resolveBlogDetail(): { minWords: number; paragraphSentences: string; citations: boolean } {
  const minWords = Number(process.env.WRITERGUN_MIN_WORDS ?? 1200);
  const citationsRaw = (process.env.WRITERGUN_CITATIONS ?? 'true').toLowerCase();
  const citations = citationsRaw !== '0' && citationsRaw !== 'false' && citationsRaw !== 'no';
  // “contrato” textual (não dá pra garantir, mas guia bem)
  const paragraphSentences = process.env.WRITERGUN_PARAGRAPH_SENTENCES ?? '3–6';
  return {
    minWords: Number.isFinite(minWords) && minWords > 200 ? minWords : 1200,
    paragraphSentences,
    citations,
  };
}

function writerSystemPrompt(locale: string) {
  const detail = resolveBlogDetail();
  return [
    'Você é um redator de blog.',
    localeInstruction(locale),
    `Escreva um post detalhado (alvo: >= ${detail.minWords} palavras) com parágrafos de ${detail.paragraphSentences} frases.`,
    'Evite parágrafos de 1 frase (só use em transições pontuais).',
    'Inclua exemplos práticos, trade-offs e um passo a passo quando fizer sentido.',
    'Produza um post completo em Markdown, com título, subtítulos e boa estrutura.',
    'Não invente fatos específicos (números, datas, citações) se não estiverem no contexto; prefira generalizar ou marcar como suposição.',
    'Se o material de apoio estiver em outro idioma, traduza/adapte o conteúdo para o idioma obrigatório acima.',
    detail.citations
      ? 'Quando usar informações do research, cite a fonte com link em uma seção final: "## Fontes" (lista Markdown com URLs).'
      : 'Não inclua seção de fontes, a menos que o contexto peça.',
    'Retorne APENAS Markdown (sem cercas de código).',
  ].join('\n');
}

function reviewerSystemPrompt(locale: string) {
  const detail = resolveBlogDetail();
  return [
    'Você é um editor crítico e cuidadoso.',
    localeInstruction(locale),
    'Melhore clareza, concisão, coerência e correção gramatical.',
    'Preserve o sentido e a intenção do autor. Não adicione fatos não suportados.',
    'Se houver trechos em outro idioma, traduza para o idioma obrigatório acima mantendo o sentido.',
    `Garanta parágrafos de ${detail.paragraphSentences} frases e aprofunde se estiver superficial (adicione explicações e exemplos sem inventar fatos).`,
    detail.citations
      ? 'Preserve e organize a seção "## Fontes" no final (sem links inventados).'
      : 'Não adicione fontes novas.',
    'Retorne APENAS Markdown (sem cercas de código).',
  ].join('\n');
}

function writerPrompt(context: string, locale: string) {
  return `${localeInstruction(locale)}

Contexto do autor (Markdown):
\n${context}\n`;
}

function writerPromptWithResearch(context: string, research: string, locale: string) {
  return `${localeInstruction(locale)}

Contexto do autor (Markdown):
\n${context}\n
Contexto adicional (pesquisa automática; pode conter ruído):
\n${research}\n`;
}

function reviewerPrompt(context: string, draft: string, locale: string) {
  return `${localeInstruction(locale)}

Contexto do autor (Markdown):
\n${context}\n
Rascunho para revisar (Markdown):
\n${draft}\n`;
}

function reviewerPromptWithResearch(context: string, draft: string, research: string, locale: string) {
  return `${localeInstruction(locale)}

Contexto do autor (Markdown):
\n${context}\n
Contexto adicional (pesquisa automática; pode conter ruído):
\n${research}\n
Rascunho para revisar (Markdown):
\n${draft}\n`;
}

function looksNonPortuguese(text: string): boolean {
  const lower = text.toLowerCase();
  const hits = [' que ', ' não ', ' para ', ' você', ' uma ', ' com ', ' como ', ' isso ', ' este ', ' essa '].filter((w) =>
    lower.includes(w),
  ).length;
  return hits < 2;
}

async function synthesizeResearchToPtBr(params: {
  host?: string;
  model: string;
  locale: string;
  rawResearchMd: string;
  numCtx: number;
  timeoutMs: number;
}): Promise<string> {
  const detail = resolveBlogDetail();
  const system = [
    'Você é um assistente editorial.',
    localeInstruction(params.locale),
    'Converta o conteúdo abaixo em um resumo OBJETIVO em pt-BR.',
    '- Preserve nomes próprios, comandos e paths.',
    '- Remova ruído (menus, rodapés, propagandas).',
    '- Gere seções úteis para blog: O que é, Para quem vale a pena, Como instalar/flash, Problemas comuns, Cuidados/risco, Checklist.',
    detail.citations
      ? '- Extraia e mantenha uma seção "## Fontes" com os links/URLs encontrados (sem inventar).'
      : '- Não inclua fontes.',
    'Retorne APENAS Markdown.',
  ].join('\n');

  const prompt = `Conteúdo (pode estar em inglês, com ruído):\n\n${params.rawResearchMd}`;

  return await generateText({
    host: params.host,
    model: params.model,
    system,
    prompt,
    numCtx: Math.min(params.numCtx, 8192),
    temperature: 0.2,
    timeoutMs: params.timeoutMs,
  });
}

/** Segunda tentativa: só o draft (evita estourar contexto na revisão). */
function reviewerFallbackPrompt(draft: string, locale: string) {
  return `${localeInstruction(locale)}

Revise o Markdown abaixo e devolva **somente** o texto final revisado (sem comentários antes ou depois):

${draft}`;
}

async function listTargets(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

export function registerShotCommand(program: Command) {
  const envModel = process.env.WRITERGUN_MODEL ?? 'qwen2.5:7b';
  const envNumCtx = Number(process.env.WRITERGUN_NUM_CTX ?? 8192);
  const envTimeoutMs = Number(process.env.WRITERGUN_TIMEOUT_MS ?? 120_000);
  const envWeb = (process.env.WRITERGUN_WEB ?? '').toLowerCase() === '1' || (process.env.WRITERGUN_WEB ?? '').toLowerCase() === 'true';
  const envWebMax = Number(process.env.WRITERGUN_WEB_MAX_RESULTS ?? 5);
  const envWebTimeout = Number(process.env.WRITERGUN_WEB_TIMEOUT_MS ?? 30_000);

  program
    .command('shot')
    .argument('[name]', 'nome da pasta da publicação')
    .option('--all', 'executa o pipeline em todas as pastas elegíveis', false)
    .option('--model <model>', `modelo do Ollama (default: ${envModel})`, envModel)
    .option('--host <url>', 'host do Ollama (default: http://127.0.0.1:11434)')
    .option('--num-ctx <n>', `context window (default: ${envNumCtx})`, (v) => parsePositiveInt('--num-ctx', v), envNumCtx)
    .option('--temp-write <n>', 'temperature da escrita (default: 0.7)', (v) => parseProbability('--temp-write', v), 0.7)
    .option('--temp-review <n>', 'temperature da revisão (default: 0.3)', (v) => parseProbability('--temp-review', v), 0.3)
    .option(
      '--timeout-ms <n>',
      `timeout por chamada ao Ollama (default: ${envTimeoutMs})`,
      (v) => parseNonNegativeInt('--timeout-ms', v),
      envTimeoutMs,
    )
    // boolean com default via env precisa suportar --no-web
    .option('--web', `enriquecer contexto com webSearch (default: ${envWeb})`)
    .option('--no-web', 'desabilitar webSearch (override)')
    .option('--web-max-results <n>', `max resultados webSearch (default: ${envWebMax})`, (v) => parsePositiveInt('--web-max-results', v), envWebMax)
    .option('--web-timeout-ms <n>', `timeout webSearch (default: ${envWebTimeout})`, (v) => parseNonNegativeInt('--web-timeout-ms', v), envWebTimeout)
    .description('Executa o pipeline de Escrita + Revisão (context -> draft -> final)')
    .action(async (name: string | undefined, opts: ShotOptions, cmd: Command) => {
      const root = resolveRoot(cmd.parent?.opts() as { root: string });
      // default do --web via env (pois commander não lida bem com default true + toggle)
      if (typeof (opts as unknown as { web?: boolean }).web !== 'boolean') {
        (opts as unknown as { web: boolean }).web = envWeb;
      }

      const targets: string[] = [];
      if (opts.all) {
        let names: string[];
        try {
          names = await listTargets(root);
        } catch {
          console.log(chalk.yellow(`Pasta raiz não encontrada: ${chalk.bold(path.relative(process.cwd(), root))}`));
          return;
        }

        for (const n of names) {
          let pubDir: string;
          try {
            pubDir = publicationDir(root, n);
          } catch {
            continue;
          }
          const ctx = contextPath(pubDir);
          const fin = finalPath(pubDir);
          if ((await pathExists(ctx)) && !(await pathExists(fin))) targets.push(n);
        }
      } else if (name) {
        targets.push(name);
      } else {
        console.log(chalk.red('Você deve informar <name> ou usar --all.'));
        return;
      }

      if (targets.length === 0) {
        console.log(chalk.gray('Nenhuma publicação elegível encontrada.'));
        log('info', 'shot.skip', 'nenhum alvo', { reason: 'empty_targets' });
        return;
      }

      const locale = resolveOutputLocale();

      log('info', 'shot.start', 'pipeline', {
        targets,
        model: opts.model,
        numCtx: opts.numCtx,
        web: opts.web,
        locale,
      });

      for (const targetName of targets) {
        let pubDir: string;
        try {
          pubDir = publicationDir(root, targetName);
        } catch (err) {
          console.log(chalk.red(String(err)));
          log('warn', 'shot.target.invalid', String(err), { target: targetName });
          continue;
        }
        const ctxFile = contextPath(pubDir);
        const draftFile = draftPath(pubDir);
        const finFile = finalPath(pubDir);
        const resFile = researchPath(pubDir);
        const resPtFile = researchPtPath(pubDir);

        const rel = (p: string) => chalk.bold(path.relative(process.cwd(), p));

        if (!(await pathExists(ctxFile))) {
          console.log(chalk.red(`Faltando ${rel(ctxFile)} (crie o contexto antes de atirar).`));
          continue;
        }

        const context = await readText(ctxFile);
        if (context.trim().length === 0) {
          console.log(chalk.red(`Arquivo vazio: ${rel(ctxFile)}`));
          continue;
        }

        let researchText: string | undefined;
        if (opts.web) {
          const title = extractTitleFromContext(context) ?? targetName;
          const query = `${title} ${targetName}`.trim();
          const webSpinner = ora(`Web search: ${chalk.cyan(query)}`).start();
          try {
            const results = await webSearch({
              host: opts.host,
              query,
              maxResults: opts.webMaxResults,
              timeoutMs: opts.webTimeoutMs,
            });
            if (results.length === 0) {
              webSpinner.fail('Web search não retornou trechos utilizáveis.');
              log('warn', 'shot.web.empty', 'webSearch sem trechos', { query, target: targetName });
              console.log(
                chalk.gray(
                  'Dica: a API pode usar title/url/snippet em vez de content — atualize o writergun. Defina WRITERGUN_DEBUG=1 para ver o JSON bruto.',
                ),
              );
              researchText = undefined;
            } else {
              await writeText(resFile, formatResearchMd(query, results));
              const rawResearchMd = await readText(resFile);
              // Sintetiza/Traduz para pt-BR antes de usar no prompt, para melhorar coerência e idioma.
              webSpinner.text = `Sintetizando research (pt-BR): ${chalk.cyan(targetName)}`;
              try {
                const researchPt = await synthesizeResearchToPtBr({
                  host: opts.host,
                  model: opts.model,
                  locale,
                  rawResearchMd,
                  numCtx: opts.numCtx,
                  timeoutMs: opts.timeoutMs,
                });
                await writeText(resPtFile, `${researchPt}\n`);
                researchText = researchPt;
              } catch (synthErr) {
                webSpinner.warn('Falha ao sintetizar (usando research bruto).');
                log('warn', 'shot.web.summarize_error', String(synthErr), { target: targetName });
                researchText = rawResearchMd;
              }

              webSpinner.succeed(`Atualizado: ${rel(resFile)}${researchText ? ` (+ ${rel(resPtFile)})` : ''}`);
              log('info', 'shot.web.ok', 'research gravado', {
                target: targetName,
                query,
                hits: results.length,
              });
            }
          } catch (err) {
            webSpinner.fail('Web search falhou (continuando sem research).');
            log('warn', 'shot.web.error', String(err), { target: targetName });
            console.log(chalk.gray(String(err)));
            researchText = undefined;
          }
        } else if (await pathExists(resFile)) {
          // Se existir um research.md (gerado manualmente), usa como contexto extra
          if (await pathExists(resPtFile)) {
            researchText = await readText(resPtFile);
          } else {
            researchText = await readText(resFile);
          }
        }

        const writeSpinner = ora(`Escrevendo draft: ${chalk.cyan(targetName)}`).start();
        let draft: string;
        try {
          draft = await generateText({
            host: opts.host,
            model: opts.model,
            system: writerSystemPrompt(locale),
            prompt: researchText ? writerPromptWithResearch(context, researchText, locale) : writerPrompt(context, locale),
            numCtx: opts.numCtx,
            temperature: opts.tempWrite,
            timeoutMs: opts.timeoutMs,
          });
          await writeText(draftFile, `${draft}\n`);
          writeSpinner.succeed(`Gerado: ${rel(draftFile)}`);
          log('info', 'shot.draft.ok', 'draft gerado', {
            target: targetName,
            chars: draft.length,
          });
          if (looksNonPortuguese(draft)) {
            log('warn', 'shot.draft.locale', 'draft parece fora do pt-BR', { target: targetName, locale });
          }
        } catch (err) {
          writeSpinner.fail(`Falha ao gerar draft para ${chalk.cyan(targetName)}`);
          log('error', 'shot.draft.error', String(err), { target: targetName });
          console.log(chalk.gray(String(err)));
          continue;
        }

        const reviewSpinner = ora(`Revisando final: ${chalk.cyan(targetName)}`).start();
        try {
          let finalText: string;
          try {
            finalText = await generateText({
              host: opts.host,
              model: opts.model,
              system: reviewerSystemPrompt(locale),
              prompt: researchText
                ? reviewerPromptWithResearch(context, draft, researchText, locale)
                : reviewerPrompt(context, draft, locale),
              numCtx: opts.numCtx,
              temperature: opts.tempReview,
              timeoutMs: opts.timeoutMs,
            });
          } catch (firstErr) {
            const msg = String(firstErr);
            const canRetry =
              msg.includes('vazio') || msg.includes('muito curta') || msg.includes('Resposta vazia');
            if (!canRetry) {
              throw firstErr;
            }
            reviewSpinner.text = `Revisão longa falhou — tentando só o draft...`;
            finalText = await generateText({
              host: opts.host,
              model: opts.model,
              system: reviewerSystemPrompt(locale),
              prompt: reviewerFallbackPrompt(draft, locale),
              numCtx: Math.min(opts.numCtx, 8192),
              temperature: opts.tempReview,
              timeoutMs: opts.timeoutMs,
            });
          }
          await writeText(finFile, `${finalText}\n`);
          reviewSpinner.succeed(`Gerado: ${rel(finFile)}`);
          log('info', 'shot.final.ok', 'final gerado', {
            target: targetName,
            chars: finalText.length,
          });
          if (looksNonPortuguese(finalText)) {
            log('warn', 'shot.final.locale', 'final parece fora do pt-BR', { target: targetName, locale });
          }
        } catch (err) {
          reviewSpinner.fail(`Falha ao gerar final para ${chalk.cyan(targetName)}`);
          log('error', 'shot.final.error', String(err), { target: targetName });
          console.log(chalk.gray(String(err)));
        }
      }
    });
}

