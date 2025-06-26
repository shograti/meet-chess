import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
        const logger = new Logger('HTTP');

        const { method, originalUrl } = req;
        const ip = req.ip;
        const userAgent = req.get('user-agent') || '';
        const start = Date.now();

        res.on('finish', () => {
            const { statusCode } = res;
            const contentLength = res.get('content-length') || 0;
            const duration = Date.now() - start;

            const coloredMethod = chalk.blue.bold(method);
            const coloredStatus =
                statusCode >= 500
                    ? chalk.red.bold(statusCode)
                    : statusCode >= 400
                        ? chalk.yellow.bold(statusCode)
                        : chalk.green.bold(statusCode);

            const coloredDuration = duration > 1000
                ? chalk.red(`${duration}ms`)
                : chalk.green(`${duration}ms`);

            logger.log(
                `${coloredMethod} ${originalUrl} ${coloredStatus} - ${contentLength}b - ${coloredDuration} - ${chalk.gray(ip)} - ${chalk.cyan(userAgent)}`
            );
        });

        next();
    }
}
