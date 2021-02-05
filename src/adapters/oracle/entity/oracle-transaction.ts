import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';
import { Transaction, DatabaseNames } from '../../../types';

const json = {
	to: value => JSON.stringify(value),
	from: value => JSON.parse(value),
};

@Entity({ name: DatabaseNames.TRANSACTIONS })
export class OracleTransaction extends BaseEntity implements Transaction {

	constructor(options: Partial<OracleTransaction> = {}) {
		super();
		Object.assign(this, options);
	}

	@PrimaryColumn({ length: 64 })
	id: string;

	@Column()
	type: number;

	@Column()
	typeString: string;

	@Column({ type: 'timestamp' })
	timestamp: Date;

	@Column({ length: 64 })
	blockHash: string;

	@Column()
	blockHeight: number;

	@Column()
	channelName: string;

	@Column()
	channelVersion: string;

	@Column({ nullable: true })
	chaincodeName: string;

	@Column({ nullable: true })
	chaincodeVersion: string;

	@Column({ nullable: true })
	chaincodeResponseStatus: number;

	@Column({ type: 'varchar2', length: 2000, transformer: json, nullable: true })
	chaincodeResponse: any;

	@Column({ type: 'varchar2', length: 2000, transformer: json, nullable: true })
	chaincodeWrites: {
		[key: string]: string | object;
	};

	@Column({ type: 'varchar2', length: 2000, transformer: json, nullable: true })
	chaincodeReads: {
		[key: string]: {
			block: number;
			transaction: number;
		};
	};
}
