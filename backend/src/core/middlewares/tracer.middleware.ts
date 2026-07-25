import { randomUUID } from 'crypto';
import chalk from 'chalk';
import { Request, Response, NextFunction } from 'express';
import { log } from '@core/constants/logger.constant.ts';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

const methodColor = (method: string) => {
  switch (method) {
    case 'GET':
      return chalk.cyan.bold(method);
    case 'POST':
      return chalk.blue.bold(method);
    case 'PUT':
      return chalk.yellow.bold(method);
    case 'PATCH':
      return chalk.magenta.bold(method);
    case 'DELETE':
      return chalk.red.bold(method);
    default:
      return chalk.white.bold(method);
  }
};

const statusColor = (status: number) => {
  if (status >= 500) return chalk.red.bold(status);
  if (status >= 400) return chalk.yellow.bold(status);
  if (status >= 300) return chalk.cyan.bold(status);
  return chalk.green.bold(status);
};

const durationColor = (ms: number) => {
  if (ms >= 1000) return chalk.red(`${ms}ms`);
  if (ms >= 300) return chalk.yellow(`${ms}ms`);
  return chalk.green(`${ms}ms`);
};

export function tracer(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl, params, query, body } = req;

  req.requestId = randomUUID().slice(0, 8);
  res.setHeader('X-Request-Id', req.requestId);

  const tag = chalk.dim.bold(`[${req.requestId}]`);

  log('info', `${tag} ${chalk.gray('→')} ${methodColor(method)} ${chalk.white(originalUrl)}`);

  const payload = {
    ...(params && Object.keys(params).length ? { params } : {}),
    ...(query && Object.keys(query).length ? { query } : {}),
    ...(body && Object.keys(body).length ? { body } : {}),
  };

  if (Object.keys(payload).length) {
    log('debug', `${tag} payload`, payload);
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'success';
    const size = res.get('content-length');

    log(
      level,
      `${tag} ${chalk.gray('←')} ${methodColor(method)} ${chalk.white(originalUrl)} ` +
        `${statusColor(res.statusCode)} ${chalk.gray('(')}${durationColor(duration)}${chalk.gray(')')}` +
        `${size ? chalk.dim(` ${size}b`) : ''}`
    );
  });

  next();
}