const dotenv = require('dotenv')
const { CouchDBWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const _ = require('lodash');
const util = require('util');

dotenv.config();

const walletUrl = process.env.WALLET_URL;
const networkConfigPath = process.env.NETWORK_CONFIG_PATH || './credentials/network-config.json';
const adminId = process.env.ADMIN_ID || 'issuer';
const channels = [
	'demo1general',
	'demo2general',
];

const config = JSON.parse(fs.readFileSync(networkConfigPath).toString());
const wallet = new CouchDBWallet({ url: walletUrl });

const _transactions = [];
const _listeners = [];

async function main() {
	const discovery = { enabled: false, asLocalhost: true };
	const gateway = new Gateway();
	await gateway.connect(config, { identity: adminId, wallet, discovery });
	for (const channelName of channels) {
		const channel = await gateway.getNetwork(channelName);
		_listeners.push(await channel.addBlockListener('listener', onBlockEvent, { startBlock: 0 }))
	}
}

async function onBlockEvent(error, blockEvent) {
	console.log('Block Listener Event');
	if (error) {
		console.error(error);
		return;
	}

	const block = {
		number: parseInt(blockEvent.header.number, 10),
		hash: blockEvent.header.data_hash,
		previousHash: blockEvent.header.previous_hash,
	}

	const transactions = _.get(blockEvent, 'data.data', []).map(transactionData => {
		const channelHeader = _.get(transactionData, 'payload.header.channel_header');
		const chaincodeResponse = _.get(transactionData, 'payload.data.actions[0].payload.action.proposal_response_payload.extension');

		return {
			block,
			transaction: {
				txId: channelHeader.tx_id,
				type: channelHeader.type,
				typeString: channelHeader.typeString,
				timestamp: new Date(channelHeader.timestamp),
			},
			channel: {
				name: channelHeader.channel_id,
				version: channelHeader.version
			},
			chaincode: chaincodeResponse
				? {
					name: chaincodeResponse.chaincode_id.name,
					version: chaincodeResponse.chaincode_id.version,
					status: chaincodeResponse.response.status,
					response: tryJsonParse(chaincodeResponse.response.payload),
					writes: Object.assign({}, ...chaincodeResponse.results.ns_rwset.map(item => {
						const writes = {};
						item.rwset.writes.forEach(write => {
							writes[write.key] = write.isDelete ? null : tryJsonParse(write.value);
						});
						return writes;
					})),
				}
				: null,
		}
	});
	_transactions.push(...transactions);
	console.log(util.inspect(transactions, false, null, true))
}

function tryJsonParse(value) {
	try {
		return JSON.parse(value);
	} catch (error) {
		return value;
	}
}

main().catch(error => {
	console.error(error);
	process.exit(-1);
});

process.stdin.resume();

process.on('SIGINT', function () {
	fs.writeFileSync('transactions.json', JSON.stringify(_transactions, null, 4));
	for (const listener of _listeners) {
		listener.unregister();
	}
	process.exit(0);
});
