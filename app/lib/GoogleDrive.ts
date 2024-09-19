import { drive, drive_v3 } from '@googleapis/drive';

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
}

export async function folderSize(folderId: string): Promise<number> {
  let size = 0;
  for await (const file of listFiles(folderId)) {
    size += parseInt(file.size!);
  }
  console.log(size);
  return size;
}