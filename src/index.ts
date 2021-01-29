import * as dotenv from 'dotenv';
import * as bodyParser from 'body-parser';
import * as express from 'express';
dotenv.config();

// Import after dotenv.config()
import { Explorer } from './explorer';
import { getLogger } from './utilities';

const logger = getLogger();
const port = process.env.PORT || 4201;

(async () => {
	try {
		const explorer = new Explorer({ channels: ['demo1general', 'demo1issuer'] });

		const app = express();
		app.use(express.static('static'));
		app.use(bodyParser.json());
		explorer.applyMiddleware({ app, path: '/api' });
		app.listen(port, () => logger.info(`API Listening on ${port}`));

		await explorer.start();

		process.on('SIGINT', () => {
			logger.warn('SIGINT');
			explorer.stop();
			process.exit(0);
		});
	} catch (error) {
		logger.error(`Unable to start:`, error);
		process.exit(-1);
	}
})();
