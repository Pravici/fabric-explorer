import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import * as express from 'express';
import { Explorer } from './explorer';
import { getLogger } from './utilities';

dotenv.config();

const logger = getLogger();
const port = process.env.PORT || 4201;

(async () => {
	try {
		const explorer = new Explorer();

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
