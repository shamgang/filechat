import { redirect } from 'next/navigation';
import { storePdfs } from 'ragapp-shared/vector-store';
import {
  hasFolderId,
  getFolderId,
  allFilesArePdf,
  getFilesSize
} from '@/lib/InputHelpers';
import { folderSize, downloadFolder } from '@/lib/GoogleDrive';
import { MAX_UPLOAD_SIZE_KB, MAX_CLOUD_FOLDER_SIZE_KB } from '@/lib/Config';

class Form {
  private form: FormData;

  constructor(formData: FormData) {
    this.form = formData;
  }

  get files(): File[] {
    return this.form.getAll('files') as File[];
  }

  get folderUrl(): string {
    return (this.form.get('folderUrl') || '') as string;
  }

  get fileSize(): number {
    return getFilesSize(this.files);
  }

  get hasFiles(): boolean {
    return this.fileSize > 0;
  }

  get hasFolderUrl(): boolean {
    return this.folderUrl !== '';
  }

  // Returns a string if there is an error, otherwise nothing
  async validate(): Promise<string | undefined> {
    if (!this.hasFiles && !this.hasFolderUrl) {
      return 'No inputs provided';
    }
    if (this.hasFiles && this.hasFolderUrl) {
      return 'Too many inputs provided';
    }
    if (this.hasFiles) {
      // Files only
      if (!allFilesArePdf(this.files)) {
        return 'Invalid non-PDF file type.';
      }
      if (this.fileSize > MAX_UPLOAD_SIZE_KB * 1000) {
        return `File size exceeded maximum of ${MAX_UPLOAD_SIZE_KB} KB`;
      }
    } else {
      // Folder only
      if (!hasFolderId(this.folderUrl)) {
        return 'Invalid folder URL';
      }
      const folderId = getFolderId(this.folderUrl);
      if (await folderSize(folderId) > MAX_CLOUD_FOLDER_SIZE_KB * 1000) {
        return `Google Drive folder size exceeded maximum of ${MAX_CLOUD_FOLDER_SIZE_KB} KB`;
      }
    }
  }
}

export type FormHandler = (prevState: string | undefined, formData: FormData) => Promise<string | undefined>;

// Server-side form handler that returns string in case of error.
export const serverFormHandler: FormHandler = async function (prevState, formData) {
  'use server'

  console.info('Received form submission on server');

  const form = new Form(formData);

  const error = await form.validate();

  if (error) {
    console.info(`Form validation failed on server: ${error}`);
    return error;
  }

  const newSessionId = crypto.randomUUID();
  let pdfs: File[] | AsyncGenerator<string>;

  if (form.hasFiles) {
    // Files only
    const filesLog = form.files.map(f => {
      return {
        size: f.size,
        lastModified: f.lastModified,
        type: f.type
      }
    });
    console.info(`Got files: ${JSON.stringify(filesLog)}`);
    console.info(`Indexing file contents into new session ${newSessionId}`);
    pdfs = form.files;
  } else {
    // Folder only
    const folderId = getFolderId(form.folderUrl)
    console.info(`Got Google Drive folder: ${folderId}`);
    pdfs = downloadFolder(folderId);
  }

  await storePdfs(newSessionId, pdfs);
  console.info(`Files successfully indexed into session ${newSessionId}`);

  redirect(`/chat/${newSessionId}`);
};