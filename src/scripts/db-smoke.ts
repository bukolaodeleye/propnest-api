import 'dotenv/config';
import { prisma } from '../lib/prisma.js';

async function main() {
  try {
    const agentsCount = await prisma.agent.count();
    const propertiesCount = await prisma.property.count();
    const viewingsCount = await prisma.viewing.count();

    console.log("Database connection successful");
    console.log(`Agents: ${agentsCount}`);
    console.log(`Properties: ${propertiesCount}`);
    console.log(`Viewings: ${viewingsCount}`);
  } catch (err) {
    console.error("Database query failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
