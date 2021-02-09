import { GatewayOptions } from 'fabric-network';
import { CouchDatabase, DatabaseAdapter, OracleDatabase } from './adapters';
import { ExplorerAPI } from './explorer-api';

export * from './types-common';

export type ExplorerOptions = Partial<
  {
    couchdb: ConstructorParameters<typeof CouchDatabase>[0];
    oracledb: ConstructorParameters<typeof OracleDatabase>[0];
    database: DatabaseAdapter;
    api: boolean | ExplorerAPI;
    writeInterval: number;
    channels: string | Array<string | ChannelOption>;
    walletPath: string;
    walletUrl: string;
    networkConfig: string | NetworkConfig;
    networkConfigPath: string;
  } & GatewayOptions
>;

export type NetworkConfig = Record<
  string,
  { channels: Record<string, unknown> }
>;

export interface ChannelOption {
  name: string;
  options: {
    startBlock: 'auto' | number;
  };
}
