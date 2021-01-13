import { CouchDBWallet } from 'fabric-network';
import * as fs from 'fs';
import { config } from './src/config';
import { SyncManager } from './src/sync-manager';
import * as api from './src/api';

const networkConfig = JSON.parse(fs.readFileSync(config.networkConfigPath).toString());
const channels = Object.keys(networkConfig.channels);
const gatewayOptions = {
	identity: config.wallet.identity,
	wallet: new CouchDBWallet({ url: config.wallet.url }),
	discovery: { enabled: false, asLocalhost: true },
};

const manager: SyncManager = new SyncManager(config.db.url);
const server = api.create(manager.nano);

(async function () {
	try {
		// Start API Server
		server.listen(config.api.port, () => console.log(`API listening on ${config.api.port}`));

		// Connect to Blockchain
		await manager.connect(networkConfig, gatewayOptions);

		// Start Sync
		await manager.start(channels);
	} catch (error) {
		console.error(error);
		process.exit(-1);
	}
})();

process.on('SIGINT', () => {
	console.log('Exiting');
	if (manager) {
		manager.teardown();
	}
	process.exit(0);
});

// process.stdin.resume();


