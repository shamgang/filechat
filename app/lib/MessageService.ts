import { OnServerDataMessageArgs, StartOptions, WebPubSubClient } from '@azure/web-pubsub-client';
import { Mutex } from 'async-mutex';
import { logger } from 'filechat-shared/logger';

const TIMEOUT = 30000; // 30 seconds timeout
const MAX_RETRIES = 3;

async function getWebSocketUrl(): Promise<string> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_HOST + '/api/negotiate');
      if (!res.ok) {
        throw new Error(`Negotiate request error: ${res.status} ${res.statusText}: ${await res.text()}`);
      }
      return (await res.json()).url;
    } catch (error) {
      logger.error(`Error in getWebSocketUrl (attempt ${i + 1}/${MAX_RETRIES}):`, error);
      if (i === MAX_RETRIES - 1) throw error;
      const backoffTime = 1000 * Math.pow(2, i);
      logger.info(`Retrying in ${backoffTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
  throw new Error('Max retries reached for getWebSocketUrl');
};

async function runWithTimeout<T>(fn: () => Promise<T>, errorMessage: string): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), TIMEOUT))
  ]);
}

class WebPubSubClientAwaitable extends WebPubSubClient {
  status: 'started' | 'stopped' | 'starting' | 'stopping' = 'stopped';

  async startStateful(options?: StartOptions): Promise<void> {
    this.status = 'starting';
    try {
      await runWithTimeout(
        () => this.start(options),
        'WebPubSubClientAwaitable.startStateful timeout'
      );
      this.status = 'started';
    } catch (error) {
      this.status = 'stopped';
      throw error;
    }
  }

  async stopStateful(): Promise<void> {
    this.status = 'stopping';
    this.stop();
    await runWithTimeout(
      () => new Promise<void>(resolve => {
        const handler = () => {
          this.status = 'stopped';
          resolve();
          this.off('stopped', handler);
        };
        this.on('stopped', handler);
      }),
      'WebPubSubClientAwaitable.stopStateful timeout'
    );
  };
}

async function createClient(): Promise<WebPubSubClientAwaitable> {
  logger.info('Creating Web PubSub client.');
  const url = await getWebSocketUrl();
  return new WebPubSubClientAwaitable(url);
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

  async open(messageHandler: MessageHandler): Promise<void> {
    logger.info('Opening message service.');
    try {
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
    } catch (error) {
      logger.error('Error in MessageService.open');
      logger.error(error);
      throw error;
    }
  }

  async send(sessionId: string, messageText: string): Promise<void> {
    logger.info(`Sending message "${messageText}" on session ${sessionId}.`);
    try {
      await (await MessageService.client).sendEvent("message", { sessionId, messageText }, "json", { fireAndForget: true });
    } catch (error) {
      logger.error('Error in MessageService.send');
      logger.error(error);
      throw error;
    }
  }

  async close(): Promise<void> {
    logger.info('Closing message service');
    try {
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
    } catch (error) {
      logger.error('Error in MessageService.close');
      logger.error(error);
      throw error;
    }
  }
};