import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { UpdateAddressDTO } from './dto/update-adress-dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressesRepository: Repository<Address>,
  ) {}

  async update(id: string, updateAddressDTO: UpdateAddressDTO) {
    this.addressesRepository.update(id, updateAddressDTO);
  }
}
