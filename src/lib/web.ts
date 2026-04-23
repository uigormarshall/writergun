import { Ollama } from 'ollama';

export type WebSearchParams = {
  host?: string;
  query: string;
  maxResults: number;
  timeoutMs: number;
};

/**
 * A API `https://ollama.com/api/web_search` pode devolver `content` e/ou
 * `title`, `url`, `snippet`, etc. Antes só liamos `content` — o resto virava [].
 */
function extractSearchHit(r: unknown): string {
  if (r == null) return '';
  if (typeof r === 'string') return r.trim();

  if (typeof r !== 'object') return String(r).trim();

  const o = r as Record<string, unknown>;
  const title = typeof o.title === 'string' ? o.title.trim() : '';
  const url = typeof o.url === 'string' ? o.url.trim() : '';
  const body =
    (typeof o.content === 'string' && o.content.trim()) ||
    (typeof o.snippet === 'string' && o.snippet.trim()) ||
    (typeof o.text === 'string' && o.text.trim()) ||
    (typeof o.description === 'string' && o.description.trim()) ||
    '';

  const lines: string[] = [];
  if (title) lines.push(`**Título:** ${title}`);
  if (url) lines.push(`**URL:** ${url}`);
  if (body) lines.push(body);

  if (lines.length > 0) {
    return lines.join('\n\n');
  }

  try {
    return JSON.stringify(o, null, 2);
  } catch {
    return '';
  }
}

export async function webSearch(params: WebSearchParams): Promise<string[]> {
  const host = params.host ?? process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434';
  const apiKey = process.env.OLLAMA_API_KEY;
  const client = new Ollama({
    host,
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
  });

  const webPromise = client.webSearch({
    query: params.query,
    maxResults: params.maxResults,
  });

  let t: NodeJS.Timeout | undefined;
  const res = await Promise.race([
    webPromise,
    new Promise<never>((_, reject) => {
      t = setTimeout(() => {
        reject(new Error(`Timeout no webSearch do Ollama em ${host} após ${params.timeoutMs}ms`));
      }, params.timeoutMs);
    }),
  ]).finally(() => {
    if (t) clearTimeout(t);
  });

  if (process.env.WRITERGUN_DEBUG === '1' || process.env.WRITERGUN_DEBUG === 'true') {
    console.error('[writergun] webSearch raw (primeiros 2k):', JSON.stringify(res).slice(0, 2000));
  }

  return (res.results ?? [])
    .map((item) => extractSearchHit(item))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
