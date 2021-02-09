import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';
import { Block, DatabaseNames } from '../../../types';

@Entity({ name: DatabaseNames.BLOCKS })
export class OracleBlock extends BaseEntity implements Block {
  constructor(options: Partial<OracleBlock> = {}) {
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
