import chalk from 'chalk';
import { ENV, ENVCONFIG } from '@config/env.config.js';
import { ErrorLog } from '@db/models/errorlog.model.ts';

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug';

export function log(level: LogLevel = 'info', message: string, ...args: any[]) {
  if (ENVCONFIG.prod) return;

  if (level === 'debug' && !ENVCONFIG.debug) return;

  const timestamp = chalk.gray(new Date().toLocaleTimeString());

  const styles: Record<LogLevel, string> = {
    info: chalk.blue('ℹ INFO'),
    success: chalk.green('✔ SUCCESS'),
    warn: chalk.yellow('⚠ WARN'),
    error: chalk.red('✖ ERROR'),
    debug: chalk.magenta('🐛 DEBUG'),
  };

  const label = styles[level] ?? chalk.white('LOG');

  const output = `${timestamp} ${label} ${message}`;

  if (level === 'error') {
    console.error(output, ...args);
  } else if (level === 'warn') {
    console.warn(output, ...args);
  } else {
    console.log(output, ...args);
  }
}

export async function logErrorToDB(err: any) {
  try {
    await ErrorLog.create({
      requestId: err.requestId,
      method: err.method,
      route: err.route,
      caller: err.caller,
      statusCode: err.statusCode || 500,
      message: err.message,
      stack: err.stack,
    });
  } catch (dbErr) {
    // last-resort fallback — if the DB write itself fails, at least surface it in console
    console.error('Failed to persist error log:', dbErr);
  }
}
