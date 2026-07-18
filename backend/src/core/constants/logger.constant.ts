import chalk from 'chalk';
import { ENV, ENVCONFIG } from '@config/env.config.js';

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
