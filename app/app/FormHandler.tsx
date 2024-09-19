import {
  hasFolderId,
  getFolderId,
  allFilesArePdf,
  getFilesSize
} from '@/lib/InputHelpers';
import { folderSize } from '@/lib/GoogleDrive';
import { MAX_FILE_SIZE_KB } from '@/lib/Config';

export type FormHandler = (prevState: string | undefined, formData: FormData) => Promise<string | undefined>;

// Server-side form handler that returns string in case of error.
export const serverFormHandler: FormHandler = async function (prevState, formData) {
  'use server'

  console.info('Received form submission on server');

  const files = formData.getAll('files') as File[];
  const fileSize = getFilesSize(files);
  const folderUrl = (formData.get('folderUrl') || '') as string;
  if (fileSize === 0 && folderUrl === '') {
    return 'No inputs provided';
  }
  if (fileSize > 0 && folderUrl !== '') {
    return 'Too many inputs provided';
  }
  if (fileSize > 0) {
    // Files only
    if (!allFilesArePdf(files)) {
      return 'Invalid non-PDF file type.';
    }
    if (fileSize > MAX_FILE_SIZE_KB * 1024) {
      return `File size exceeded maximum of ${MAX_FILE_SIZE_KB} KB`;
    }
    const filesLog = files.map(f => {
      return {
        size: f.size,
        lastModified: f.lastModified,
        type: f.type
      }
    });
    console.info(`Got files: ${JSON.stringify(filesLog)}`);
  } else {
    // Folder only
    if (!hasFolderId(folderUrl)) {
      return 'Invalid folder URL';
    }
    const folderId = getFolderId(folderUrl);
    if (await folderSize(folderId) > MAX_FILE_SIZE_KB * 1024) {
      return `Google Drive folder size exceeded maximum of ${MAX_FILE_SIZE_KB} KB`;
    }
    console.info(`Got Google Drive folder: ${folderId}`);
  }
};