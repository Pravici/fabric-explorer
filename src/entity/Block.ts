import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'EXPLORER_BLOCKS' })
export class Block extends BaseEntity {

	constructor(options: Partial<Block> = {}) {
		super();
		Object.assign(this, options);
	}

	@PrimaryColumn({ length: 64 })
	id: string;

	@Column({ type: 'timestamp' })
	timestamp: Date;

	@Column()
	height: number;

	@Column()
	previousHash: string;

	@Column()
	transactions: number;

	@Column()
	channelName: string;
}
