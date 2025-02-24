import { Event } from 'src/events/entities/event.entity';
import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class GameFormat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('time', { name: 'time', nullable: true })
  time?: Date;

  @Column({ name: 'increment', nullable: true })
  increment?: number;

  @Column({ name: 'additional_time', nullable: true })
  additionalTime?: number;

  @OneToMany(() => Event, (events) => events.gameFormat, { nullable: true })
  events?: Event[];
}
