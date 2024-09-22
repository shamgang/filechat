// Max Next.js request body size is listed as 1MB, which it handles by truncating
// Set our internal validation to a slightly lower number to make sure no truncation occurs
// TODO: use chunked+resumable upload instead to handle larger files
export const MAX_UPLOAD_SIZE_KB = 999;
export const MAX_CLOUD_FOLDER_SIZE_KB = parseInt(process.env.NEXT_PUBLIC_MAX_CLOUD_FOLDER_SIZE_KB!);