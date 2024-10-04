import { app, trigger } from '@azure/functions';
import { WebPubSubServiceClient } from '@azure/web-pubsub';
import { ask } from 'filechat-shared/assistant';
import { logger } from 'filechat-shared/logger';

const wpsTrigger = trigger.generic({
  type: 'webPubSubTrigger',
  name: 'request',
  hub: 'filechat',
  eventName: 'message',
  eventType: 'user'
});

type WebPubSubRequest = {
  data: string,
  dataType: 'Json' | string,
  connectionContext: {
    eventType: 'User' | string,
    eventName: 'message' | string,
    hub: string,
    connectionId: string,
    userId?: string,
    origin: string,
  }
};

type ClientMessage = {
  sessionId: string,
  messageText: string
};

app.generic('message', {
  trigger: wpsTrigger,
  handler: async (request: WebPubSubRequest) => {
    const connectionId = request.connectionContext.connectionId;
    const client = new WebPubSubServiceClient(process.env.WebPubSubConnectionString, process.env.WEB_PUBSUB_HUB);
    let message: ClientMessage;
    try {
      message = JSON.parse(request.data) as ClientMessage;
      logger.info(`Message handler invoked for session id ${message.sessionId} and connection ${connectionId}.`);
      const answer = await ask(message.sessionId, message.messageText);
      logger.info(`Message handler sending response to session ${message.sessionId} and connection ${connectionId}.`);
      await client.sendToConnection(connectionId, { responseChunk: answer });
      await client.sendToConnection(connectionId, { endResponse: true });
    } catch (error) {
      logger.error(`Error in message handler for session ${message?.sessionId} and connection ${connectionId}.`);
      logger.error(error);
      await client.sendToConnection(connectionId, { error: error.message });
    }
  }
});