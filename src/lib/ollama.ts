import { Ollama, type ChatResponse, type GenerateResponse } from 'ollama';

export type GenerateParams = {
  host?: string;
  model: string;
  prompt: string;
  system?: string;
  numCtx: number;
  temperature: number;
  timeoutMs?: number;
};

/** Evita gravar arquivo “vazio” por resposta só com whitespace / bug de API. */
const MIN_OUTPUT_CHARS = 12;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, host: string): Promise<T> {
  let t: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    t = setTimeout(() => {
      reject(new Error(`Timeout falando com Ollama em ${host} após ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (t) clearTimeout(t);
  });
}

function normalizeGenerateText(genRes: GenerateResponse): string {
  let text = (genRes.response ?? '').trim();
  if (!text && genRes.thinking?.trim()) {
    text = genRes.thinking.trim();
  }
  return text;
}

function normalizeChatText(chatRes: ChatResponse): string {
  let text = (chatRes.message?.content ?? '').trim();
  if (!text && chatRes.message?.thinking?.trim()) {
    text = chatRes.message.thinking.trim();
  }
  return text;
}

/**
 * Preferimos `generate` (mais estável com vários modelos locais); depois `chat` se vier curto/vazio.
 */
export async function generateText(params: GenerateParams): Promise<string> {
  const host = params.host ?? process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434';
  const client = new Ollama({ host });

  const timeoutMs = params.timeoutMs ?? Number(process.env.WRITERGUN_TIMEOUT_MS ?? 120_000);
  const options = {
    num_ctx: params.numCtx,
    temperature: params.temperature,
  };

  const messages = [
    ...(params.system?.trim()
      ? [{ role: 'system' as const, content: params.system.trim() }]
      : []),
    { role: 'user' as const, content: params.prompt },
  ];

  const genRes = (await withTimeout(
    client.generate({
      model: params.model,
      prompt: params.prompt,
      system: params.system,
      stream: false,
      options,
    }) as Promise<GenerateResponse>,
    timeoutMs,
    host,
  )) as GenerateResponse;

  let text = normalizeGenerateText(genRes);
  if (text.length >= MIN_OUTPUT_CHARS) {
    return text;
  }

  const chatRes = (await withTimeout(
    client.chat({
      model: params.model,
      messages,
      stream: false,
      options,
    }),
    timeoutMs,
    host,
  )) as ChatResponse;

  text = normalizeChatText(chatRes);
  if (text.length >= MIN_OUTPUT_CHARS) {
    return text;
  }

  const debug =
    process.env.WRITERGUN_DEBUG === '1' || process.env.WRITERGUN_DEBUG === 'true'
      ? ` generate_done_reason=${genRes.done_reason ?? '?'} eval_count=${genRes.eval_count} chat_done_reason=${chatRes.done_reason ?? '?'} chat_eval_count=${chatRes.eval_count}`
      : '';

  throw new Error(
    `Resposta vazia ou muito curta do Ollama (modelo=${params.model}). ` +
      `Reduza WRITERGUN_NUM_CTX, encurte context.md/research, aumente timeout ou troque de modelo.${debug}`,
  );
}
