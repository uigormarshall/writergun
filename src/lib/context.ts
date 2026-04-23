export function extractTitleFromContext(context: string): string | undefined {
  // 1) Tenta pegar a primeira linha que pareça título Markdown (# ...)
  for (const line of context.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = /^#{1,3}\s+(.+)$/.exec(trimmed);
    if (m?.[1]) return m[1].trim();
    break;
  }

  // 2) Tenta pegar a linha após "## Título" / "## Título provisório"
  const lines = context.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]?.trim().toLowerCase();
    if (l === '## título' || l === '## titulo' || l === '## título provisório' || l === '## titulo provisório') {
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        const candidate = lines[j]?.trim();
        if (candidate) return candidate;
      }
    }
  }

  return undefined;
}

