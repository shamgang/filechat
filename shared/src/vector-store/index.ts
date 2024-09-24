import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from '@langchain/openai';
import { AzureAISearchQueryType } from '@langchain/community/vectorstores/azure_aisearch';
import moment from 'moment';

import { loadPdf, splitDocuments } from '../file-processing';
import { AzureAISearchVectorStore, AdditionalMetadataFields } from '../ai-search';


const ENDPOINT = process.env.AZURE_AISEARCH_ENDPOINT!;
const INDEX_NAME = process.env.AZURE_AISEARCH_INDEX_NAME!;
const ADMIN_KEY = process.env.AZURE_AISEARCH_KEY!;
const MAX_INDEX_CHECK_RETRIES = 3;
const INDEX_CHECK_SLEEP_MS = 1000;

type AdditionalMetadata = {
  sessionId: string,
  timestamp: number
};

const additionalMetadataFields: AdditionalMetadataFields<AdditionalMetadata> = {
  'sessionId': {
    name: 'sessionId',
    type: "Edm.String",
    filterable: true,
  },
  'timestamp': {
    name: 'timestamp',
    type: "Edm.Int64",
    filterable: true,
    sortable: true,
  }
};

function getVectorStore(): AzureAISearchVectorStore<AdditionalMetadata> {
  return new AzureAISearchVectorStore<AdditionalMetadata>(
    new OpenAIEmbeddings(),
    {
      endpoint: ENDPOINT,
      key: ADMIN_KEY,
      indexName: INDEX_NAME,
      search: {
        type: AzureAISearchQueryType.SimilarityHybrid
      },
      additionalMetadataFields: additionalMetadataFields
    }
  );
}

function getSessionFilter(sessionId: string): string {
  return `metadata/sessionId eq '${sessionId}'`;
}

export async function sessionExists(id: string): Promise<boolean> {
  const results = await getVectorStore().similaritySearch('*', 1, {
    filterExpression: getSessionFilter(id)
  });
  return results.length > 0;
};

async function documentExists(id: string): Promise<boolean> {
  const results = await getVectorStore().similaritySearch('*', 1, {
    filterExpression: `id eq '${id}'`
  });
  return results.length > 0;
};

async function sleep(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms));
}

export class IndexCheckTimeoutError extends Error {};

async function waitForDocumentToExist(id: string): Promise<void> {
  let numRetries = 0;
  while(true) {
    if (await documentExists(id)) {
      return;
    }
    console.info('Documents not indexed, retrying.');
    if (numRetries >= MAX_INDEX_CHECK_RETRIES) {
      throw new IndexCheckTimeoutError('Index check timed out.');
    }
    numRetries++;

    await sleep(INDEX_CHECK_SLEEP_MS);
  }
}

// Uploads a pdf in split documents to the vector store and returns a list of ids of each created document
export async function storePdf(sessionId: string, file: string | File): Promise<string[]> {
  const docs = await loadPdf(file);
  const splitDocs = await splitDocuments(docs);
  const docsWithMetadata = splitDocs.map(doc => {
    const docUuid = crypto.randomUUID();
    const docId = sessionId + '-' + docUuid;
    doc.id = docId;
    doc.metadata.sessionId = sessionId;
    doc.metadata.timestamp = Date.now();
    return doc;
  });
  const docIds = docsWithMetadata.map(doc => doc.id!);
  return getVectorStore().addDocuments(docsWithMetadata, { ids: docIds });
};

export async function storePdfs(sessionId: string, files: File[] | AsyncGenerator<string>): Promise<void> {
  const addedIds: string[] = [];
  if (Array.isArray(files)) {
    // Array input
    for (const file of files) {
      const result = await storePdf(sessionId, file);
      addedIds.push(...result);
    }
  } else {
    // Async generator input
    for await (const file of files) {
      const result = await storePdf(sessionId, file);
      addedIds.push(...result);
    }
  }

  // Wait for the last ID to appear in search as a heuristic marker that indexing is complete.
  await waitForDocumentToExist(addedIds[addedIds.length - 1]);
};

export async function search(sessionId: string, query: string): Promise<Document[]> {
  const vectorStore = getVectorStore();
  const results = await vectorStore.similaritySearch(
    query,
    10,
    {
      filterExpression: getSessionFilter(sessionId)
    }
  );
  return results;
};

export async function clean(): Promise<void> {
  const lifetime = parseInt(process.env.DOCUMENT_LIFETIME_MIN!);
  const now = moment();
  const formatString = 'YYYY-MM-DD HH:mm:ss';
  const threshold = now.clone().subtract(lifetime, 'minutes');
  console.log(now);
  console.log(formatString);
  console.info(`Cleaning up at ${now.format(formatString)}. Deleting documents created before ${threshold.format(formatString)} (${lifetime} minutes ago)`);
  const vectorStore = getVectorStore();
  await vectorStore.delete({
    filter: {
      filterExpression: `metadata/timestamp lt ${threshold.valueOf()}`
    }
  });
};