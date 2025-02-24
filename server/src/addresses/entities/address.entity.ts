import { Event } from 'src/events/entities/event.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  street: string;

  @Column()
  zip: string;

  @Column()
  city: string;

  @Column()
  country: string;

  @Column({ nullable: true })
  latitude: string;

  @Column({ nullable: true })
  longitude: string;

  @OneToMany(() => Event, (event) => event.address)
  events: Event[];
}
