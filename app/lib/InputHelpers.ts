export class FolderIdNotFoundError extends Error {};

// Return a string folder ID or false if not found.
export function getFolderId(input: string): string | false {
  // Check if the string contains "drive.google.com/drive/folders"
  const googleDrivePattern = /drive\.google\.com\/drive\/.*folders\/([a-zA-Z0-9_-]{33})(?:[/?]|$)/;
  const alphanumeric33Pattern = /^[a-zA-Z0-9_-]{33}$/;

  // Check if the input contains the Google Drive folders URL pattern
  const match = input.match(googleDrivePattern);
  if (match) {
    return match[1];
  } else {
      // Check if the whole string is a 33-character alphanumeric string
      if (alphanumeric33Pattern.test(input)) {
          return input;
      }
  }
  throw new FolderIdNotFoundError();
}

export function hasFolderId(input: string): boolean {
  try {
    return !!getFolderId(input);
  } catch (err) {
    if (err instanceof FolderIdNotFoundError) {
      return false;
    } else {
      throw err;
    }
  }
}

export function getFilesSize(files: FileList): number {
  let totalSize = 0;
  for (let i = 0; i < files.length; i++) {
    totalSize += files[i].size;
  }
  return totalSize;
}

export const MAX_UPLOADED_FILE_SIZE_KB = parseInt(process.env.NEXT_PUBLIC_MAX_UPLOADED_FILE_SIZE_KB!);

export function uploadedFilesTooLarge(files: FileList): boolean {
  const maxSizeBytes = MAX_UPLOADED_FILE_SIZE_KB * 1024;
  return getFilesSize(files) > maxSizeBytes;
}