import 'dotenv/config';
import { prisma } from '../lib/prisma.js';

async function main() {
  console.log('--- Part P: Relationship verification ---');
  // Foreign keys prevent orphan properties/viewings natively.
  // We'll verify relationships by fetching samples.

  // 3. Samples
  const sampleAgent = await prisma.agent.findFirst({
    include: { properties: true }
  });
  console.log(`Sample Agent (${sampleAgent?.email}) has ${sampleAgent?.properties.length} properties.`);

  const sampleProperty = await prisma.property.findFirst({
    include: { agent: true, viewings: true }
  });
  console.log(`Sample Property (${sampleProperty?.title}) belongs to ${sampleProperty?.agent.name} and has ${sampleProperty?.viewings.length} viewings.`);

  console.log('\n--- Part Q: Distribution checks ---');
  // Cities
  const cities = await prisma.property.groupBy({
    by: ['city'],
    _count: true
  });
  console.log(`Cities represented: ${cities.length} (${cities.map(c => c.city).join(', ')})`);

  // PropertyType
  const propertyTypes = await prisma.property.groupBy({
    by: ['propertyType'],
    _count: true
  });
  console.log(`Property Types represented: ${propertyTypes.length} (${propertyTypes.map(c => c.propertyType).join(', ')})`);

  // ListingType
  const listingTypes = await prisma.property.groupBy({
    by: ['listingType'],
    _count: true
  });
  console.log(`Listing Types represented: ${listingTypes.length} (${listingTypes.map(c => c.listingType).join(', ')})`);

  // ViewingStatus
  const viewingStatuses = await prisma.viewing.groupBy({
    by: ['status'],
    _count: true
  });
  console.log(`Viewing Statuses represented: ${viewingStatuses.length} (${viewingStatuses.map(c => c.status).join(', ')})`);

  console.log('\n--- Part S: Determinism check ---');
  const firstAgent = await prisma.agent.findFirst({ orderBy: { email: 'asc' } });
  console.log(`First agent (alphabetical by email): ${firstAgent?.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
