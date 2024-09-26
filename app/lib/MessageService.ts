import { OnServerDataMessageArgs, StartOptions, WebPubSubClient } from '@azure/web-pubsub-client';
import { Mutex } from 'async-mutex';

import { logger } from 'ragapp-shared/logger';

async function getWebSocketUrl(): Promise<string> {
  const res = await fetch(process.env.NEXT_PUBLIC_API_HOST + '/api/negotiate');
  if (!res.ok) {
    const error = `Negotiate request error: ${res.status} ${res.statusText}: ${await res.text()}`;
    throw new Error(error);
  }
  return (await res.json()).url;
};

class WebPubSubClientAwaitable extends WebPubSubClient {
  status: 'started' | 'stopped' | 'starting' | 'stopping' = 'stopped';

  async startStateful(options?: StartOptions): Promise<void> {
    this.status = 'starting';
    await this.start(options);
    this.status = 'started';
  }

  // Since WebPubSubClient.stop is async but not awaitable, wrap it in a Promise.
  async stopStateful(): Promise<void> {
    this.status = 'stopping';
    this.stop();
    return new Promise(resolve => {
      const handler = () => {
        this.status = 'stopped';
        resolve();
        this.off('stopped', handler);
      };
      this.on('stopped', handler);
    });
  };
}

async function createClient(): Promise<WebPubSubClientAwaitable> {
  logger.info('Creating Web PubSub client.');
  const url = await getWebSocketUrl();
  const client = new WebPubSubClientAwaitable(url);
  return client;
};

export type ServerMessage = {
  responseChunk: string,
  error?: string,
  endResponse?: boolean
};

export type MessageHandler = (msg: ServerMessage) => void;

export class MessageService {
  private static client = createClient();
  private static mutex = new Mutex();
  private responseHandler?: (e: OnServerDataMessageArgs) => void;

  async open(messageHandler: MessageHandler) {
    logger.info('Opening message service.');
    const client = await MessageService.client;
    const responseHandler = (event: OnServerDataMessageArgs) => {
      const sequence = event.message.sequenceId;
      const message = event.message.data as ServerMessage;
      logger.info(`Received response ${sequence}: ${JSON.stringify(message)}.`);
      messageHandler(message);
    };
    client.on('server-message', responseHandler);
    this.responseHandler = responseHandler;
    await MessageService.mutex.runExclusive(async () => {
      if (client.status === 'started') {
        logger.info('Already started, skip starting.');
      } else {
        logger.info('Starting client');
        await client.startStateful();
        logger.info('Client started.');
      }
    });
  }

  async send(sessionId: string, messageText: string) {
    logger.info(`Sending message ${messageText} on session ${sessionId}.`);
    (await MessageService.client).sendEvent("message", { sessionId, messageText }, "json", { fireAndForget: true });
  }

  async close(): Promise<void> {
    logger.info('Closing message service');
    const client = await MessageService.client;
    if (this.responseHandler) {
      client.off('server-message', this.responseHandler);  
    }
    await MessageService.mutex.runExclusive(async () => {
      if (client.status === 'stopped') {
        logger.info('Already stopped, skip stopping.');
      } else {
        logger.info('Stopping client');
        await client.stopStateful();
        logger.info('Client stopped.');
      }
    });
  }
};