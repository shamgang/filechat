import {
  hasFolderId,
  getFolderId,
  allFilesArePdf,
  uploadedFilesTooLarge,
  MAX_UPLOADED_FILE_SIZE_KB,
  getFilesSize
} from '@/lib/InputHelpers';

export type FormHandler = (prevState: string | undefined, formData: FormData) => Promise<string | undefined>;

// Server-side form handler that returns string in case of error.
export const submitForm: FormHandler = async function (prevState, formData) {
  'use server'

  console.info('Received form submission on server');
  console.info(formData);

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
    if (uploadedFilesTooLarge(files)) {
      return `File size exceeded maximum of ${MAX_UPLOADED_FILE_SIZE_KB} KB`;
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
    if (!hasFolderId(folderUrl as string)) {
      return 'Invalid folder URL';
    }
    console.info(`Got Google Drive folder: ${getFolderId(folderUrl as string)}`);
  }
};