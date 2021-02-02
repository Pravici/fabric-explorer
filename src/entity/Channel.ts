import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'EXPLORER_CHANNELS' })
export class Channel extends BaseEntity {

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
