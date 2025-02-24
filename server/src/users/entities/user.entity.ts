import {
  Entity,
  OneToMany,
  ManyToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  Unique,
} from 'typeorm';
import { Event } from 'src/events/entities/event.entity';
import { Exclude } from 'class-transformer';

@Entity()
@Unique(['email'])
@Unique(['username'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'email' })
  email: string;

  @Column({ name: 'username' })
  username: string;

  @Exclude()
  @Column({ name: 'password' })
  password: string;

  @Column({ name: 'first_name', nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', nullable: true })
  lastName?: string;

  @OneToMany(() => Event, (event) => event.creator)
  createdEvents: Event[];

  @ManyToMany(() => Event, (event) => event.participants)
  participatingEvents: Event[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
