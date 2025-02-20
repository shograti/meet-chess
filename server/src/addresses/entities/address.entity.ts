import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'street' })
  street: string;

  @Column({ name: 'zip' })
  zip: string;

  @Column({ name: 'city' })
  city: string;

  @Column({ name: 'country' })
  country: string;

  @Column({ name: 'latitude', nullable: true })
  latitude: string;

  @Column({ name: 'longitude', nullable: true })
  longitude: string;
}
