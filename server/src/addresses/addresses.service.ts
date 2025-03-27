import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { UpdateAddressDTO } from './dto/update-adress-dto';
import { CreateAddressDTO } from './dto/create-address-dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressesRepository: Repository<Address>,
  ) {}

  async createAddress(createAddressDTO: CreateAddressDTO) {
    const existingAddress = await this.addressesRepository.findOne({
      where: {
        street: createAddressDTO.street,
        zip: createAddressDTO.zip,
        city: createAddressDTO.city,
        country: createAddressDTO.country,
      },
    });

    if (existingAddress) {
      return existingAddress;
    }

    if (createAddressDTO.country === 'France') {
      const coordinates = await this.getCoordinates(
        createAddressDTO.street,
        createAddressDTO.city,
        createAddressDTO.zip,
      );

      const address = this.addressesRepository.save({
        ...createAddressDTO,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

      return address;
    }

    const address = this.addressesRepository.create(createAddressDTO);
    return this.addressesRepository.save(address);
  }

  async getCoordinates(street: string, city: string, zip: string) {
    const apiUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(street + ' ' + city + ' ' + zip)}`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const geometry = data.features[0].geometry;

        const coordinates = {
          latitude: geometry.coordinates[1],
          longitude: geometry.coordinates[0],
        };

        return coordinates;
      } else {
        console.warn('No address found for the provided query.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      return null;
    }
  }

  async update(id: string, updateAddressDTO: UpdateAddressDTO) {
    this.addressesRepository.update(id, updateAddressDTO);
  }
}
