import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Client } from '@opensearch-project/opensearch';

import { PrismaClient } from '../../dist/generated/prisma/client.js';

const prisma = new PrismaClient();
const opensearch = new Client({
  node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
});

type RoCrateMetadata = {
  '@context': string;
  '@graph': Array<{
    '@id': string;
    '@type': string | string[];
    name?: string;
    description?: string;
    identifier?: string;
    license?: { '@id': string };
    contentLicense?: { '@id': string };
    metadataLicense?: { '@id': string };
    memberOf?: { '@id': string };
    isPartOf?: { '@id': string };
    hasPart?: Array<{ '@id': string }>;
    inLanguage?: { '@id': string };
    [key: string]: unknown;
  }>;
};

const loadRoCrate = (path: string) => {
  const content = readFileSync(path, 'utf-8');

  return JSON.parse(content) as RoCrateMetadata;
};

const extractEntityType = (typeField: string | string[]): string => {
  const types = Array.isArray(typeField) ? typeField : [typeField];

  const pcdmType = types.find((t) => t.includes('pcdm.org'));
  const schemaType = types.find((t) => t.includes('schema.org'));

  return pcdmType || schemaType || types[0];
};

const processCollection = async (
  collectionDir: string,
  collectionRocrateId: string,
  items: Array<{ dir: string; id: string }>,
) => {
  console.log(`\nProcessing collection: ${collectionDir}`);

  const collectionPath = join(import.meta.dirname, collectionDir, 'ro-crate-metadata.json');
  const collectionCrate = loadRoCrate(collectionPath);
  const collectionRoot = collectionCrate['@graph'].find((node) => node['@id'] === './');

  if (!collectionRoot) {
    throw new Error(`No root entity found in ${collectionPath}`);
  }

  const collectionEntity = {
    rocrateId: collectionRocrateId,
    name: collectionRoot.name || 'Untitled Collection',
    description: collectionRoot.description || '',
    entityType: extractEntityType(collectionRoot['@type']),
    memberOf: null,
    rootCollection: null,
    metadataLicenseId:
      collectionRoot.metadataLicense?.['@id'] ||
      collectionRoot.license?.['@id'] ||
      'https://creativecommons.org/licenses/by/4.0/',
    contentLicenseId:
      collectionRoot.contentLicense?.['@id'] ||
      collectionRoot.license?.['@id'] ||
      'https://creativecommons.org/licenses/by/4.0/',
    rocrate: collectionCrate,
  };

  const collection = await prisma.entity.create({
    data: collectionEntity,
  });
  console.log(`  ✓ Created collection: ${collection.name}`);

  for (const item of items) {
    await processItem(collectionDir, item.dir, item.id, collectionRocrateId);
  }
};

const processItem = async (
  collectionDir: string,
  itemDir: string,
  itemRocrateId: string,
  collectionRocrateId: string,
) => {
  const itemPath = join(import.meta.dirname, collectionDir, itemDir, 'ro-crate-metadata.json');
  const itemCrate = loadRoCrate(itemPath);
  const itemRoot = itemCrate['@graph'].find((node) => node['@id'] === './');

  if (!itemRoot) {
    throw new Error(`No root entity found in ${itemPath}`);
  }

  const itemEntity = {
    rocrateId: itemRocrateId,
    name: itemRoot.name || 'Untitled Item',
    description: itemRoot.description || '',
    entityType: extractEntityType(itemRoot['@type']),
    memberOf: collectionRocrateId,
    rootCollection: collectionRocrateId,
    metadataLicenseId:
      itemRoot.metadataLicense?.['@id'] || itemRoot.license?.['@id'] || 'https://creativecommons.org/licenses/by/4.0/',
    contentLicenseId:
      itemRoot.contentLicense?.['@id'] || itemRoot.license?.['@id'] || 'https://creativecommons.org/licenses/by/4.0/',
    rocrate: itemCrate,
  };

  const item = await prisma.entity.create({
    data: itemEntity,
  });
  console.log(`    ✓ Created item: ${item.name}`);

  // Process File entities from hasPart
  if (itemRoot.hasPart && Array.isArray(itemRoot.hasPart)) {
    for (const partRef of itemRoot.hasPart) {
      const fileNode = itemCrate['@graph'].find((node) => node['@id'] === partRef['@id']);

      if (!fileNode) continue;

      const fileType = extractEntityType(fileNode['@type']);

      // Only create entities for PCDM File types
      if (fileType === 'http://schema.org/MediaObject' || fileType === 'File') {
        const fileRocrateId = fileNode.identifier?.['@id'] || `${itemRocrateId}/${fileNode['@id']}`;

        const fileEntity = {
          rocrateId: fileRocrateId,
          name: fileNode.name || fileNode['@id'],
          description: fileNode.description || '',
          entityType: 'http://schema.org/MediaObject',
          memberOf: itemRocrateId,
          rootCollection: collectionRocrateId,
          metadataLicenseId:
            itemRoot.metadataLicense?.['@id'] ||
            itemRoot.license?.['@id'] ||
            'https://creativecommons.org/licenses/by/4.0/',
          contentLicenseId:
            fileNode.license?.['@id'] || itemRoot.license?.['@id'] || 'https://creativecommons.org/licenses/by/4.0/',
          rocrate: { '@context': itemCrate['@context'], '@graph': [fileNode] },
        };

        const file = await prisma.entity.create({
          data: fileEntity,
        });
        console.log(`      ✓ Created file: ${file.name}`);
      }
    }
  }
};

const createOpenSearchIndex = async (): Promise<void> => {
  console.log('\nSetting up OpenSearch index...');

  try {
    await opensearch.indices.delete({ index: 'entities' });
    console.log('  ✓ Deleted existing index');
  } catch (_error) {
    // Index doesn't exist, that's fine
  }

  // Create new index with mappings
  await opensearch.indices.create({
    index: 'entities',
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
          entityType: { type: 'keyword' },
          memberOf: { type: 'keyword' },
          rootCollection: { type: 'keyword' },
          metadataLicenseId: { type: 'keyword' },
          contentLicenseId: { type: 'keyword' },
          inLanguage: { type: 'keyword' },
          location: { type: 'geo_point' },
          mediaType: { type: 'keyword' },
          communicationMode: { type: 'keyword' },
        },
      },
    },
  });

  console.log('  ✓ Created index with mappings');
};

const indexEntities = async (): Promise<void> => {
  console.log('\nIndexing entities in OpenSearch...');

  const entities = await prisma.entity.findMany();
  const operations = entities.flatMap((entity) => [
    { index: { _index: 'entities', _id: `${entity.id}` } },
    {
      rocrateId: entity.rocrateId,
      name: entity.name,
      description: entity.description,
      entityType: entity.entityType,
      memberOf: entity.memberOf,
      rootCollection: entity.rootCollection,
      metadataLicenseId: entity.metadataLicenseId,
      contentLicenseId: entity.contentLicenseId,
    },
  ]);

  await opensearch.bulk({
    body: operations,
    refresh: true,
  });

  console.log(`  ✓ Indexed ${entities.length} entities`);
};

const seed = async (): Promise<void> => {
  console.log('🌱 Seeding database with sample language documentation collections...\n');

  try {
    console.log('Clearing existing data...');
    await prisma.entity.deleteMany({});
    console.log('  ✓ Database cleared');

    await processCollection('collection-01-nyeleni', 'http://example.com/collection/nyeleni-001', [
      { dir: 'item-01-greeting', id: 'http://example.com/item/nyeleni-greeting-001' },
      { dir: 'item-02-story', id: 'http://example.com/item/nyeleni-story-001' },
      { dir: 'item-03-vocabulary', id: 'http://example.com/item/nyeleni-vocabulary-001' },
    ]);

    await processCollection('collection-02-coastal', 'http://example.com/collection/coastal-001', [
      { dir: 'item-01-narrative', id: 'http://example.com/item/coastal-narrative-001' },
      { dir: 'item-02-songs', id: 'http://example.com/item/coastal-songs-001' },
      { dir: 'item-03-conversation', id: 'http://example.com/item/coastal-conversation-001' },
    ]);

    await createOpenSearchIndex();
    await indexEntities();

    const entityCounts = await prisma.entity.groupBy({
      by: ['entityType'],
      _count: true,
    });

    console.log('\n✅ Seeding completed successfully!');
    console.log('\nCreated:');

    for (const count of entityCounts) {
      const typeName = count.entityType.split('#').pop() || count.entityType.split('/').pop();
      console.log(`  • ${count._count} ${typeName} entities`);
    }

    console.log('\nEach item includes:');
    console.log('  - RO-Crate metadata');
    console.log('  - WAV audio file (indexed as File entity)');
    console.log('  - ELAN annotation file (indexed as File entity)');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await opensearch.close();
  }
};

// Run the seed function
seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
