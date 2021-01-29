import * as dotenv from 'dotenv';
import * as Nano from 'nano';
import * as winston from 'winston';

dotenv.config();

const logger = winston.createLogger({
	level: process.env.EXPLORER_LOG_LEVEL || 'debug',
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.simple(),
		winston.format.align(),
		winston.format.colorize({ all: true }),
		winston.format.printf(msg => {
			let message = `[${msg.level}] ${msg.timestamp} ${msg.prefix} ${msg.message}`;
			const splat = msg[Symbol.for('splat') as any];
			if (splat) {
				message += '\n';
				try {
					message += JSON.stringify(splat, null, 2);
				} catch {
					message += splat;
				}
			}
			return message;
		}),
	),
	transports: [
		new winston.transports.Console(),
	],
});

export function getLogger(prefix?: string): winston.Logger {
	return logger.child({ prefix: prefix ? `[Explorer.${prefix}]` : '[Explorer]' });
}

export function abort(message: string, error?: Error): never {
	console.error(message);
	if (error) {
		console.error(error);
	}
	return process.exit(-1);
}

export function stripMetadata(docs: Nano.MaybeDocument | Nano.MaybeDocument[]) {
	(Array.isArray(docs) ? docs : [docs]).map(doc => {
		delete doc._id;
		delete doc._rev;
	});
	return docs;
}
