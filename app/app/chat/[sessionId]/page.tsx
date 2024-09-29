import { notFound } from 'next/navigation';
import { sessionExists } from 'filechat-shared/vector-store';
import Chat from './Chat';

export default async function ChatPage({ params }: { params: { sessionId: string } }) {
  if (!await sessionExists(params.sessionId)) {
    notFound();
  }
  return (
    <Chat sessionId={params.sessionId} />
  );
}