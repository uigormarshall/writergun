import fs from 'node:fs/promises';

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function readText(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf8');
}

export async function writeText(filePath: string, content: string): Promise<void> {
  await fs.writeFile(filePath, content, 'utf8');
}

export async function removeIfExists(filePath: string): Promise<boolean> {
  try {
    await fs.rm(filePath);
    return true;
  } catch (err: unknown) {
    if (typeof err === 'object' && err && 'code' in err && (err as { code?: string }).code === 'ENOENT') {
      return false;
    }
    throw err;
  }
}

