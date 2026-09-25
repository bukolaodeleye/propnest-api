import 'dotenv/config';
import { faker } from '@faker-js/faker';
import { prisma } from '../src/lib/prisma.js';
import { PropertyType, ListingType, PropertyStatus, ViewingStatus } from '@prisma/client';

// Part E - Exact data volumes
const AGENT_COUNT = 300;
const PROPERTY_COUNT = 900;
const VIEWING_COUNT = 1500;

// Part D - Deterministic seed
faker.seed(20260922);

const locations = [
  { city: 'Lagos', state: 'Lagos' },
  { city: 'Abuja', state: 'FCT' },
  { city: 'Port Harcourt', state: 'Rivers' },
  { city: 'Ibadan', state: 'Oyo' },
  { city: 'Enugu', state: 'Enugu' },
  { city: 'Benin City', state: 'Edo' },
  { city: 'Abeokuta', state: 'Ogun' },
  { city: 'Kano', state: 'Kano' },
  { city: 'Kaduna', state: 'Kaduna' },
];

async function main() {
  console.log('Clearing existing seed data...');
  // Part L - Cleanup in correct dependency order
  await prisma.viewing.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.agent.deleteMany({});

  console.log('Generating records...');

  // 1. Generate Agents
  console.log('Inserting agents...');
  const agents = [];
  for (let i = 0; i < AGENT_COUNT; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    // Unique email guaranteed by index
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i.toString().padStart(3, '0')}@propnest.example`;
    const loc = faker.helpers.arrayElement(locations);
    
    agents.push({
      id: faker.string.uuid(),
      name: `${firstName} ${lastName}`,
      email,
      phone: faker.phone.number({ style: 'national' }),
      agencyName: `${faker.company.name()} Properties`,
      city: loc.city,
    });
  }
  await prisma.agent.createMany({ data: agents });

  // 2. Generate Properties
  console.log('Inserting properties...');
  const properties = [];
  for (let i = 0; i < PROPERTY_COUNT; i++) {
    const agent = faker.helpers.arrayElement(agents);
    const propertyType = faker.helpers.arrayElement(Object.values(PropertyType));
    const listingType = faker.helpers.arrayElement(Object.values(ListingType));
    const status = faker.helpers.arrayElement(Object.values(PropertyStatus));
    const loc = faker.helpers.arrayElement(locations);
    
    let bedrooms = 0;
    let bathrooms = 0;
    
    if (propertyType === PropertyType.land) {
      bedrooms = 0;
      bathrooms = 0;
    } else if (propertyType === PropertyType.commercial) {
      bedrooms = 0;
      bathrooms = faker.number.int({ min: 0, max: 4 });
    } else {
      bedrooms = faker.number.int({ min: 1, max: 7 });
      bathrooms = faker.number.int({ min: 1, max: bedrooms + 2 });
    }

    let title = '';
    if (propertyType === PropertyType.land) {
      title = `Plot of Land for ${listingType === ListingType.rent ? 'Lease' : 'Sale'} in ${loc.city}`;
    } else if (propertyType === PropertyType.commercial) {
      title = `Commercial Property for ${listingType === ListingType.rent ? 'Rent' : 'Sale'} in ${loc.city}`;
    } else {
      title = `${bedrooms} Bedroom ${propertyType} for ${listingType === ListingType.rent ? 'Rent' : 'Sale'} in ${loc.city}`;
    }

    // Part I - Price handling
    let price: string;
    if (listingType === ListingType.sale) {
      // Sales prices: 10m to 500m
      const basePrice = faker.number.int({ min: 10, max: 500 }) * 1000000;
      price = basePrice.toString();
    } else {
      // Rent prices: 500k to 10m
      const basePrice = faker.number.int({ min: 5, max: 100 }) * 100000;
      price = basePrice.toString();
    }

    properties.push({
      id: faker.string.uuid(),
      title,
      description: faker.lorem.paragraph(),
      price,
      city: loc.city,
      state: loc.state,
      address: faker.location.streetAddress(),
      bedrooms,
      bathrooms,
      propertyType,
      listingType,
      status,
      agentId: agent.id,
    });
  }
  
  // Use createMany with a reasonably sized chunk if needed, but 900 is fine for PostgreSQL
  await prisma.property.createMany({ data: properties });

  // 3. Generate Viewings
  console.log('Inserting viewings...');
  const viewings = [];
  for (let i = 0; i < VIEWING_COUNT; i++) {
    const property = faker.helpers.arrayElement(properties);
    
    // Dates from 30 days ago to 30 days in future
    const isFuture = faker.datatype.boolean();
    let scheduledAt: Date;
    let status: ViewingStatus;

    if (isFuture) {
      scheduledAt = faker.date.soon({ days: 30 });
      status = faker.helpers.arrayElement([ViewingStatus.pending, ViewingStatus.confirmed, ViewingStatus.cancelled]);
    } else {
      scheduledAt = faker.date.recent({ days: 30 });
      status = faker.helpers.arrayElement([ViewingStatus.completed, ViewingStatus.cancelled]);
    }

    viewings.push({
      id: faker.string.uuid(),
      propertyId: property.id,
      customerName: faker.person.fullName(),
      customerEmail: faker.internet.email(),
      customerPhone: faker.phone.number({ style: 'national' }),
      scheduledAt,
      status,
    });
  }
  
  await prisma.viewing.createMany({ data: viewings });

  console.log('PropNest seed completed successfully');
  console.log(`Agents: ${AGENT_COUNT}`);
  console.log(`Properties: ${PROPERTY_COUNT}`);
  console.log(`Viewings: ${VIEWING_COUNT}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
