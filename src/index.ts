import { CouchDBWallet, FileSystemWallet } from 'fabric-network';
import * as fs from 'fs';
import { config } from './config';
import { SyncManager } from './sync-manager';
import * as api from './api';

console.log(`Reading network config: ${config.network.path}`);
const networkConfig = JSON.parse(fs.readFileSync(config.network.path).toString());

let channels = [];
if (config.network.channels) {
	console.log(`Reading network channels: ${config.network.channels}`);
	channels = config.network.channels.split(',');
} else {
	console.log('Reading network channels from network config');
	channels = Object.keys(networkConfig.channels);
}
console.log(`Found channels: ${channels}`);

let wallet;
if (config.wallet.url) {
	wallet = new CouchDBWallet({ url: config.wallet.url });
} else if (config.wallet.path) {
	wallet = new FileSystemWallet(config.wallet.path);
}

const gatewayOptions = {
	identity: config.wallet.identity,
	wallet,
	discovery: { enabled: false, asLocalhost: true },
};

const manager: SyncManager = new SyncManager(config.db.url);
const server = api.create(manager.nano);

(async () => {
	try {
		// Start API Server
		server.listen(config.api.port, () => console.log(`API listening on ${config.api.port}`));

		// Connect to Blockchain
		await manager.connect(networkConfig, gatewayOptions);

		// Start Sync
		await manager.start(channels);
	} catch (error) {
		console.error(error);
		console.error((error as Error).stack);
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


