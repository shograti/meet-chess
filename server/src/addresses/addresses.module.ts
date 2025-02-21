import { Module } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { Address } from './entities/address.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Address])],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}
