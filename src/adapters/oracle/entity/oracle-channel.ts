import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';
import { Channel, DatabaseNames } from '../../../types';

@Entity({ name: DatabaseNames.CHANNELS })
export class OracleChannel extends BaseEntity implements Channel {

	constructor(options: Partial<Channel> = {}) {
		super();
		Object.assign(this, options);
	}

	@PrimaryColumn()
	name: string;

	@Column()
	height: number;

	@Column({ nullable: true })
	lastHash: string;
}
