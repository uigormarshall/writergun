import path from 'node:path';

export type RootOptions = {
  root: string;
};

export function resolveRoot(opts: RootOptions): string {
  return path.resolve(process.cwd(), opts.root);
}

export function publicationDir(rootDir: string, name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) throw new Error('Nome da publicação vazio.');
  if (path.isAbsolute(trimmed)) throw new Error('Nome da publicação não pode ser um path absoluto.');
  if (trimmed.includes('\0')) throw new Error('Nome da publicação inválido.');

  const target = path.resolve(rootDir, trimmed);
  const rel = path.relative(rootDir, target);
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Nome da publicação inválido (path traversal).');
  }
  return target;
}

export function contextPath(pubDir: string): string {
  return path.join(pubDir, 'context.md');
}

export function draftPath(pubDir: string): string {
  return path.join(pubDir, 'draft.md');
}

export function finalPath(pubDir: string): string {
  return path.join(pubDir, 'final.md');
}

export function researchPath(pubDir: string): string {
  return path.join(pubDir, 'research.md');
}

export function researchPtPath(pubDir: string): string {
  return path.join(pubDir, 'research.pt.md');
}

