import * as Nano from 'nano';
import * as winston from 'winston';

const logger = winston.createLogger({
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.simple(),
		winston.format.colorize({ all: true }),
		winston.format.printf(msg => {
			let message = `[${msg.level}] ${msg.timestamp} ${msg.prefix.padEnd(16)} ${msg.message}`;
			const splat = msg[Symbol.for('splat') as any];
			if (splat) {
				message += '\n';
				try {
					message += JSON.stringify(splat);
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
	process.exit(-1);
}

export function stripMetadata(docs: Nano.MaybeDocument | Nano.MaybeDocument[]) {
	(Array.isArray(docs) ? docs : [docs]).map(doc => {
		delete doc._id;
		delete doc._rev;
	});
	return docs;
}
