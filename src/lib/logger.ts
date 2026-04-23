import fs from 'node:fs/promises';
import path from 'node:path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogRecord = {
  ts: string;
  level: LogLevel;
  event: string;
  msg: string;
  meta?: Record<string, unknown>;
};

function loggingEnabled(): boolean {
  const v = (process.env.WRITERGUN_LOG ?? '1').toLowerCase();
  return v !== '0' && v !== 'false' && v !== 'no';
}

function logDir(): string {
  const fromEnv = process.env.WRITERGUN_LOG_DIR?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.resolve(process.cwd(), '.writergun', 'logs');
}

function logFilePath(): string {
  const day = new Date().toISOString().slice(0, 10);
  return path.join(logDir(), `writergun-${day}.ndjson`);
}

function shouldWriteLevel(level: LogLevel): boolean {
  const min = (process.env.WRITERGUN_LOG_LEVEL ?? 'info').toLowerCase();
  const order: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const idx = (x: LogLevel) => order.indexOf(x);
  const minIdx = Math.max(0, order.indexOf(min as LogLevel) >= 0 ? idx(min as LogLevel) : 1);
  return idx(level) >= minIdx;
}

export async function logLine(record: LogRecord): Promise<void> {
  if (!loggingEnabled()) return;
  if (!shouldWriteLevel(record.level)) return;

  const line = `${JSON.stringify({
    ts: record.ts,
    level: record.level,
    event: record.event,
    msg: record.msg,
    ...(record.meta && Object.keys(record.meta).length > 0 ? { meta: record.meta } : {}),
  })}\n`;

  try {
    const file = logFilePath();
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.appendFile(file, line, 'utf8');
  } catch {
    // Nunca quebra a CLI por falha de log em disco
  }
}

export function log(level: LogLevel, event: string, msg: string, meta?: Record<string, unknown>): void {
  void logLine({
    ts: new Date().toISOString(),
    level,
    event,
    msg,
    meta,
  });
}

export function logPaths(): { dir: string; file: string } {
  return { dir: logDir(), file: logFilePath() };
}
