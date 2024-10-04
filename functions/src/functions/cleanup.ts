import { app, InvocationContext, Timer } from '@azure/functions';

import { clean } from 'filechat-shared/vector-store';
import { logger } from 'filechat-shared/logger';

export async function cleanup(myTimer: Timer, context: InvocationContext): Promise<void> {
  try {
    logger.info(`Cleanup running`);
    await clean();
    logger.info('Cleanup complete');
  } catch (error) {
    logger.error('Error in cleanup.');
    logger.error(error);
  }
};

app.timer('cleanup', {
    schedule: '0 0 0 * * *',
    handler: cleanup,
});