import {
  Column,
  Entity,
  ManyToOne,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GameFormat } from 'src/game-formats/entities/game-format.entity';
import { Address } from 'src/addresses/entities/address.entity';

export enum PairingSystem {
  SWISS = 'Swiss system',
  ROUND_ROBIN = 'Round Robin',
  KNOCK_OUT = 'Knock out',
  SCHEVENINGEN = 'Scheveningen system',
  MANUAL = 'Manual pairings',
  HAYLEY = 'Hayley',
}

@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column('text')
  description: string;

  @Column({ name: 'begins_at' })
  beginsAt: Date;

  @Column({ name: 'ends_at' })
  endsAt: Date;

  @Column({ name: 'cashprize', nullable: true })
  cashprize?: number;

  @Column({ name: 'rounds', nullable: true })
  rounds?: number;

  @Column({
    type: 'enum',
    enum: PairingSystem,
    name: 'pairing_system',
    nullable: true,
  })
  pairingSystem?: PairingSystem;

  @ManyToOne(() => User, (user) => user.createdEvents)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @ManyToMany(() => User, (user) => user.participatingEvents)
  @JoinTable({ name: 'users_participating_events' })
  participants: User[];

  @ManyToOne(() => GameFormat, (gameFormat) => gameFormat.events)
  gameFormat: GameFormat;

  @ManyToOne(() => Address, (address) => address.events)
  address: Address;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
