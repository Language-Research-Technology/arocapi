import { PrismaClient } from '../generated/prisma/client.js';

const prisma = new PrismaClient();

const BATCH_SIZE = 100;
const TOTAL_RECORDS = 1000;
const API_URL = 'https://catalog.paradisec.org.au/api/v1/oni/entities';

interface EntityResponse {
  total: number;
  entities: {
    id: string;
    name: string;
    description: string;
    conformsTo: string;
    recordType: string[];
    memberOf?: string;
    root?: string;
    // extra: Record<string, any>;
    // searchExtra: Record<string, any>;
  }[];
}

const fetchEntities = async (limit: number, offset: number) => {
  const url = `${API_URL}?limit=${limit}&offset=${offset}`;
  console.log(`Fetching ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const result = (await response.json()) as EntityResponse;

  return result;
};

const loadEntities = async (): Promise<void> => {
  try {
    console.log('Starting to load entities...');
    await prisma.$connect();

    // Track how many we've processed so far
    let processedCount = 0;

    // Continue fetching until we have processed TOTAL_RECORDS
    while (processedCount < TOTAL_RECORDS) {
      const remainingToFetch = Math.min(BATCH_SIZE, TOTAL_RECORDS - processedCount);
      const data = await fetchEntities(remainingToFetch, processedCount);

      console.log(
        `Fetched ${data.entities.length} entities (${processedCount + data.entities.length}/${TOTAL_RECORDS})`,
      );

      // Process each entity
      for (const entity of data.entities) {
        await prisma.entity.create({
          data: {
            rocrateId: entity.id,
            name: entity.name,
            description: entity.description,
            conformsTo: entity.conformsTo,
            memberOf: entity.memberOf || null,
            root: entity.root || null,
            recordType: entity.recordType,
          },
        });
      }

      processedCount += data.entities.length;
      console.log(`Processed ${processedCount}/${TOTAL_RECORDS} entities`);

      // If we've received fewer entities than requested, we've reached the end
      if (data.entities.length < remainingToFetch) {
        console.log('Reached the end of available entities');
        break;
      }
    }

    console.log(`Successfully loaded ${processedCount} entities into the database`);
  } catch (error) {
    console.error('Error loading entities:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

loadEntities()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
