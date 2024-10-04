'use client'
 
import { useEffect } from 'react';
import { logger } from 'filechat-shared/logger';
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Error reached Error component');
    logger.error(error);
  }, [error])
 
  return (
    <div className="flex flex-col gap-5 items-center justify-center h-screen text-white">
      <h2 className="text-2xl font-bold">Oops, something went wrong!</h2>
      <button
        className="bg-blue-400 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try again
      </button>
    </div>
  )
}