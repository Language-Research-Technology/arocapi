import 'dotenv/config';
import { Client } from '@opensearch-project/opensearch';
import { PrismaClient } from '../generated/prisma/client.js';
import { RecordType } from '../generated/prisma/enums.js';

const prisma = new PrismaClient();

if (!process.env.OPENSEARCH_URL) {
  throw new Error('OPENSEARCH_URL environment variable is not set');
}

// Initialize OpenSearch client
const opensearch = new Client({
  node: process.env.OPENSEARCH_URL,
});

const INDEX_NAME = 'entities';

const BATCH_SIZE = 100;
const TOTAL_RECORDS = 1000;
const API_URL = 'https://catalog.paradisec.org.au/api/v1/oni';

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
  const url = `${API_URL}/entities?limit=${limit}&offset=${offset}`;
  console.log(`Fetching ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const result = (await response.json()) as EntityResponse;

  return result;
};

const fetchEntityRocrate = async (entityId: string) => {
  const url = `${API_URL}/entity/${encodeURIComponent(entityId)}`;
  console.log(`Fetching ROCrate for ${entityId}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ROCrate API request failed with status ${response.status} for entity ${entityId}`);
  }

  const rocrate = await response.json();
  return rocrate;
};

const generateDummyData = () => {
  const languages = ['English', 'Japanese', 'French', 'Spanish', 'German', 'Italian'];
  const mediaTypes = ['audio/wav', 'audio/mp3', 'video/mp4', 'text/plain', 'image/jpeg'];
  const communicationModes = ['SpokenLanguage', 'WrittenLanguage', 'SignedLanguage', 'Song'];

  // Australian bounding box coordinates
  const lat = -25 + (Math.random() - 0.5) * 20; // -35 to -15
  const lng = 134 + (Math.random() - 0.5) * 40; // 114 to 154

  return {
    inLanguage: languages[Math.floor(Math.random() * languages.length)],
    mediaType: mediaTypes[Math.floor(Math.random() * mediaTypes.length)],
    communicationMode: communicationModes[Math.floor(Math.random() * communicationModes.length)],
    location: {
      lat,
      lon: lng,
    },
  };
};

const createIndex = async () => {
  try {
    const indexExists = await opensearch.indices.exists({ index: INDEX_NAME });

    if (indexExists.body) {
      console.log(`Index ${INDEX_NAME} already exists, deleting...`);
      await opensearch.indices.delete({ index: INDEX_NAME });
    }

    console.log(`Creating index ${INDEX_NAME}...`);
    await opensearch.indices.create({
      index: INDEX_NAME,
      body: {
        mappings: {
          properties: {
            rocrateId: { type: 'keyword' },
            name: {
              type: 'text',
              fields: {
                keyword: { type: 'keyword' },
              },
            },
            description: { type: 'text' },
            conformsTo: { type: 'keyword' },
            recordType: { type: 'keyword' },
            memberOf: { type: 'keyword' },
            root: { type: 'keyword' },
            inLanguage: { type: 'keyword' },
            mediaType: { type: 'keyword' },
            communicationMode: { type: 'keyword' },
            location: { type: 'geo_point' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
            rocrate: { type: 'text' },
          },
        },
      },
    });

    console.log('Index created successfully');
  } catch (error) {
    console.error('Error creating index:', error);
    throw error;
  }
};

// Index entity to OpenSearch
// biome-ignore lint/suspicious/noExplicitAny: FIXME
const indexEntity = async (entity: any, dummyData: any, rocrate: any) => {
  const document = {
    rocrateId: entity.id,
    name: entity.name,
    description: entity.description,
    conformsTo: entity.conformsTo,
    recordType: entity.recordType,
    memberOf: entity.memberOf || null,
    root: entity.root || null,
    inLanguage: dummyData.inLanguage,
    mediaType: dummyData.mediaType,
    communicationMode: dummyData.communicationMode,
    location: dummyData.location,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rocrate: JSON.stringify(rocrate),
  };

  await opensearch.index({
    index: INDEX_NAME,
    id: entity.id,
    body: document,
  });
};

const getRecordType = (recordType: string[]) => {
  if (recordType.includes('RepositoryCollection')) {
    return RecordType.RepositoryCollection;
  }

  if (recordType.includes('RepositoryObject')) {
    return RecordType.RepositoryObject;
  }

  throw new Error(`Unknown recordType ${recordType}`);
};

const loadEntities = async (): Promise<void> => {
  try {
    console.log('Starting to load entities...');
    await prisma.$connect();

    await createIndex();

    let processedCount = 0;

    while (processedCount < TOTAL_RECORDS) {
      const remainingToFetch = Math.min(BATCH_SIZE, TOTAL_RECORDS - processedCount);
      const data = await fetchEntities(remainingToFetch, processedCount);

      console.log(
        `Fetched ${data.entities.length} entities (${processedCount + data.entities.length}/${TOTAL_RECORDS})`,
      );

      for (const entity of data.entities) {
        const dummyData = generateDummyData();

        // Fetch ROCrate data for this entity
        const rocrate = await fetchEntityRocrate(entity.id);

        const recordType = getRecordType(entity.recordType);

        await prisma.entity.create({
          data: {
            rocrateId: entity.id,
            name: entity.name,
            description: entity.description,
            conformsTo: entity.conformsTo,
            memberOf: entity.memberOf || null,
            root: entity.root || null,
            recordType,
            rocrate: rocrate,
          },
        });

        await indexEntity(entity, dummyData, rocrate);
      }

      processedCount += data.entities.length;
      console.log(`Processed ${processedCount}/${TOTAL_RECORDS} entities`);

      if (data.entities.length < remainingToFetch) {
        console.log('Reached the end of available entities');
        break;
      }
    }

    await opensearch.indices.refresh({ index: INDEX_NAME });

    console.log(`Successfully loaded ${processedCount} entities into database and OpenSearch`);
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
