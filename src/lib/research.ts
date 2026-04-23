export function formatResearchMd(query: string, results: string[]): string {
  const now = new Date().toISOString();
  const blocks = results.map((c, idx) => `### Resultado ${idx + 1}\n\n${c}\n`);

  return `# Research (auto)

- Gerado em: ${now}
- Query: ${query}

---

${blocks.join('\n')}
`;
}

