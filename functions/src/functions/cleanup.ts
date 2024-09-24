import { app, InvocationContext, Timer } from '@azure/functions';

import { clean } from 'ragapp-shared/vector-store';

export async function cleanup(myTimer: Timer, context: InvocationContext): Promise<void> {
    const logger = context;
    logger.info(`Cleanup running`);
    await clean();
    logger.info('Cleanup complete');
}

app.timer('cleanup', {
    schedule: '0 0 0 * * *',
    handler: cleanup,
});