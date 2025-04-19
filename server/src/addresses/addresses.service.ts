import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';

const MIN_INTERVAL_MS = 20; // 50 requests/sec = 20ms per request
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 300; // in ms

let lastRequestTimestamp = 0;
const addressCache = new Map<string, Partial<Address>>(); // Simple in-memory cache
const logger = new Logger('AddressesService');

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttleApiCall(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTimestamp;

  if (elapsed < MIN_INTERVAL_MS) {
    await delay(MIN_INTERVAL_MS - elapsed);
  }

  lastRequestTimestamp = Date.now();
}

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressesRepository: Repository<Address>,
  ) {}

  async getAddressFromApi(fullAddress: string): Promise<Partial<Address>> {
    if (!fullAddress) {
      throw new BadRequestException('Address string is empty.');
    }

    if (addressCache.has(fullAddress)) {
      return addressCache.get(fullAddress);
    }

    const apiUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
      fullAddress,
    )}`;

    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      await throttleApiCall();
      try {
        const response = await fetch(apiUrl);

        if (response.status === 429) {
          const delayTime = RETRY_BASE_DELAY * 2 ** attempt;
          logger.warn(`Rate limit hit. Retrying in ${delayTime}ms...`);
          await delay(delayTime);
          attempt++;
          continue;
        }

        if (!response.ok) {
          throw new InternalServerErrorException(
            `API call failed with status: ${response.status}`,
          );
        }

        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const properties = data.features[0].properties;
          const geometry = data.features[0].geometry;

          if (
            !properties.street ||
            !properties.city ||
            !properties.postcode ||
            !geometry?.coordinates
          ) {
            throw new BadRequestException(
              'Incomplete address data received from API.',
            );
          }

          const houseNumber = properties.housenumber || '';
          const street = houseNumber
            ? `${houseNumber} ${properties.street}`
            : properties.street;

          const parsedAddress: Partial<Address> = {
            street,
            city: properties.city,
            zip: properties.postcode,
            country: 'France',
            latitude: geometry.coordinates[1],
            longitude: geometry.coordinates[0],
          };

          addressCache.set(fullAddress, parsedAddress); // cache it
          return parsedAddress;
        } else {
          throw new BadRequestException(
            'No address found for the provided query.',
          );
        }
      } catch (error) {
        if (attempt === MAX_RETRIES - 1) {
          logger.error(`Failed after ${MAX_RETRIES} attempts:`, error);
          throw new InternalServerErrorException(
            'Failed to fetch address from external API.',
          );
        }

        logger.warn(`Fetch attempt ${attempt + 1} failed, retrying...`);
        await delay(RETRY_BASE_DELAY * 2 ** attempt);
        attempt++;
      }
    }
  }

  async createAddress(fullAddress: string): Promise<Address> {
    let apiResponse: Partial<Address>;
    try {
      apiResponse = await this.getAddressFromApi(fullAddress);
    } catch (error) {
      logger.error(
        `Could not fetch address for: "${fullAddress}". Reason: ${error.message}`,
      );
      return null; // Prevent crash, caller will decide what to do
    }

    const existingAddress = await this.addressesRepository.findOne({
      where: {
        street: apiResponse.street,
        zip: apiResponse.zip,
        city: apiResponse.city,
        country: apiResponse.country,
        latitude: apiResponse.latitude,
        longitude: apiResponse.longitude,
      },
    });

    if (existingAddress) {
      return existingAddress;
    }

    const address = this.addressesRepository.create(apiResponse);
    return this.addressesRepository.save(address);
  }
}
