import { pathExists } from './fs.js';
import { contextPath, draftPath, finalPath } from './paths.js';

export type PublicationStatus = 'PENDENTE' | 'DRAFT' | 'FINAL' | 'VAZIO';

export async function getPublicationStatus(pubDir: string): Promise<PublicationStatus> {
  const hasContext = await pathExists(contextPath(pubDir));
  const hasDraft = await pathExists(draftPath(pubDir));
  const hasFinal = await pathExists(finalPath(pubDir));

  if (hasFinal) return 'FINAL';
  if (hasDraft) return 'DRAFT';
  if (hasContext) return 'PENDENTE';
  return 'VAZIO';
}

