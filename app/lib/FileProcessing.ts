import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import type { Document } from "@langchain/core/documents";
import { CharacterTextSplitter } from 'langchain/text_splitter';

export async function loadPdf(file: string | File): Promise<Document[]> {
  const loader = new PDFLoader(file);
  const docs = await loader.load();
  return docs;
};

export async function splitDocuments(docs: Document[]): Promise<Document[]> {
  const splitter = new CharacterTextSplitter();
  return await splitter.splitDocuments(docs);
};