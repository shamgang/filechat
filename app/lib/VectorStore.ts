import 'server-only'

import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from '@langchain/openai';
import {
  AzureAISearchVectorStore,
  AzureAISearchQueryType
} from '@langchain/community/vectorstores/azure_aisearch';

import { loadPdf, splitDocuments } from './FileProcessing';

const ENDPOINT = process.env.AZURE_AISEARCH_ENDPOINT!;
const INDEX_NAME = process.env.AZURE_AISEARCH_INDEX_NAME!;
const ADMIN_KEY = process.env.AZURE_AISEARCH_KEY!;
const MAX_INDEX_CHECK_RETRIES = 3;
const INDEX_CHECK_SLEEP_MS = 1000;
const SESSION_ID_KEY = 'sessionId';

function getVectorStore(): AzureAISearchVectorStore {
  return new AzureAISearchVectorStore(
    new OpenAIEmbeddings(),
    {
      endpoint: ENDPOINT,
      key: ADMIN_KEY,
      indexName: INDEX_NAME,
      search: {
        type: AzureAISearchQueryType.SimilarityHybrid
      }
    }
  );
}

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
    doc.metadata.attributes = [
      { key: SESSION_ID_KEY, value: sessionId }
    ];
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
  const vectorStore = new AzureAISearchVectorStore(
    new OpenAIEmbeddings(),
    {
      indexName: INDEX_NAME,
      search: {
        type: AzureAISearchQueryType.SimilarityHybrid
      }
    }
  );
  const results = await vectorStore.similaritySearch(
    query,
    10,
    {
      filterExpression: `metadata/attributes/any(a: a/key eq '${SESSION_ID_KEY}' and a/value eq '${sessionId}')`
    }
  );
  return results;
};
