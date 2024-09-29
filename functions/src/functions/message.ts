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
    const message = JSON.parse(request.data) as ClientMessage;
    const connectionId = request.connectionContext.connectionId;
    logger.info({ connectionId, message }, 'Message handler invoked.');
    const answer = await ask(message.sessionId, message.messageText);
    logger.info(answer);
    const client = new WebPubSubServiceClient(process.env.WebPubSubConnectionString, process.env.WEB_PUBSUB_HUB);
    await client.sendToConnection(connectionId, { responseChunk: answer });
    await client.sendToConnection(connectionId, { endResponse: true });
  }
});