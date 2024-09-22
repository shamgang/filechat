import 'server-only';

import fs from 'fs-extra';
import tmp from 'tmp';
import path from 'path';
import { Readable } from 'stream';
import { drive, drive_v3 } from '@googleapis/drive';
import type { GaxiosResponse } from 'gaxios';

const driveClient = drive({
  version: 'v3',
  auth: process.env.GOOGLE_DRIVE_API_KEY
});

// Recursively list files in a google drive folder.
// List only supported files (pdf, google doc)
export async function* listFiles(folderId: string): AsyncGenerator<drive_v3.Schema$File> {
  let nextPageToken: string | undefined = undefined;

  do {
    const fileList: drive_v3.Schema$FileList = (await driveClient.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      pageSize: 1000, // Adjust page size as needed
      fields: 'nextPageToken, files(id, kind, name, modifiedTime, mimeType, description, fileExtension, size, contentHints, imageMediaMetadata, videoMediaMetadata)',
      pageToken: nextPageToken,
    })).data;

    if (fileList.files) {
      for (const file of fileList.files) {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          // Recurse if it's a folder
          yield* listFiles(file.id!);
        } else if (
          file.mimeType === 'application/pdf' ||
          file.mimeType === 'application/vnd.google-apps.document'
        ) {
          // Yield only if it's a PDF or Google Doc
          console.log({size: file.size, name: file.name});
          yield file;
        }
      }
    }

    nextPageToken = fileList.nextPageToken || undefined;
  } while (nextPageToken);
};

export async function folderSize(folderId: string): Promise<number> {
  let size = 0;
  for await (const file of listFiles(folderId)) {
    size += parseInt(file.size!);
  }
  console.log(size);
  return size;
};

export async function downloadFile(tmpDir: string, file: drive_v3.Schema$File): Promise<string> {

  console.info(`Downloading file ${file.id} to temp dir: ${tmpDir}`);

  let response: GaxiosResponse<Readable>;
  if (file.mimeType === 'application/pdf') {
    console.info(`Downloading PDF: ${file.id}`);
    response = await driveClient.files.get(
      { fileId: file.id!, alt: 'media' },
      { responseType: 'stream' }
    );
  } else if (file.mimeType === 'application/vnd.google-apps.document') {
    console.info(`Exporting Google Doc to PDF: ${file.id}`);
    response = await driveClient.files.export(
      { fileId : file.id!, mimeType: 'application/pdf' },
      { responseType: 'stream' }
    );
  } else {
    throw new Error('Invalid mime type.');
  }

  const tempFilePath = path.join(tmpDir, `${file.id}.pdf`);
  console.info(`Downloading file to path: ${tempFilePath}`);
  const dest = fs.createWriteStream(tempFilePath);

  return new Promise<string>((res, rej) => {
    response.data
    .once('end', () => {
      res(tempFilePath);
    })
    .once('error', rej)
    .pipe(dest);
  });

};

// Downloads every supported file in a folder as a PDF and yields the path to a temp file
export async function* downloadFolder(folderId: string): AsyncGenerator<string> {
  const tmpDir = tmp.dirSync({
    unsafeCleanup: true
  }).name;
  console.info(`Created tempdir: ${tmpDir}`);
  for await (const file of listFiles(folderId)) {
    yield downloadFile(tmpDir, file);
  }
}