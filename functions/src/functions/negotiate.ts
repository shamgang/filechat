import { app, input, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

import { logger } from 'filechat-shared/logger';

const connection = input.generic({
    type: 'webPubSubConnection',
    name: 'connection',
    hub: 'filechat'
});

app.http('negotiate', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    extraInputs: [connection],
    handler: async (request: HttpRequest, context: InvocationContext) => {
        logger.info('Negotiate invoked.');
        return { jsonBody: context.extraInputs.get('connection') } as HttpResponseInit;
    },
});
