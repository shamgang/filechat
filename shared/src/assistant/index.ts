import { ChatOpenAI } from '@langchain/openai';

import { search } from '../vector-store';

export async function ask(sessionId: string, question: string): Promise<string> {
  const model = new ChatOpenAI({
    model: process.env.OPENAI_CHAT_MODEL,
    openAIApiKey: process.env.OPENAI_API_KEY
  });

  const docs = await search(sessionId, question);
  const context = docs.map(doc => doc.pageContent).join('\n\n');

  const prompt = [
    {
      role: "system",
      content: `You are a helpful assistant. Use the following context from the user's documents to help answer questions.\n\nContext: ${context}`,
    },
    {
      role: "user",
      content: question,
    },
  ];

  const response = await model.invoke(prompt);

  return response.content as string;
}