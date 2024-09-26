'use client'

import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { useFormState } from 'react-dom';
import Image from 'next/image';
import { FileUpIcon, XIcon, LoaderCircle } from 'lucide-react';
import { logger } from 'ragapp-shared/logger';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { hasFolderId, getFilesSize } from '@/lib/InputHelpers';
import { MAX_UPLOAD_SIZE_KB } from '@/lib/Config';
import type { FormHandler } from './FormHandler';
import FormPendingListener from './FormPendingListener';

export default function FilesForm({ serverFormHandler }: { serverFormHandler: FormHandler }) {
  const [driveUrl, setDriveUrl] = useState<string>('');
  const [files, setFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<boolean>(false);
  const [serverValidationError, submitToServer] = useFormState<string | undefined, FormData>(serverFormHandler, undefined);
  const [modifiedSinceError, setModifiedSinceError] = useState<boolean>(false);

  // Every time the server handler returns, reset modifiedSinceError
  useEffect(() => {
    if (serverValidationError) {
      logger.info(`Got validation error from server: ${serverValidationError}`);
    }
    setModifiedSinceError(false);
  }, [serverValidationError, setModifiedSinceError]);

  // Clear the display error if modified, display it if not
  let clientValidationError: string | undefined;

  const hasLink = driveUrl.length > 0;
  const hasValidLink = hasLink && hasFolderId(driveUrl);
  const hasFiles = !!(files && files.length > 0);
  const tooLarge = hasFiles && getFilesSize(files) > MAX_UPLOAD_SIZE_KB * 1000;
  if (tooLarge) {
    clientValidationError = `File size exceeded maximum of ${MAX_UPLOAD_SIZE_KB} KB`;
  }
  const hasValidFiles = hasFiles && !tooLarge;
  const readyToSubmit = !pending && (hasValidLink || hasValidFiles);

  if (clientValidationError) {
    logger.info(`Got validation error on client: ${clientValidationError}`);
  }

  const displayError: string | undefined = modifiedSinceError ? clientValidationError : serverValidationError

  return (
    <form action={submitToServer}>
      <div className="flex flex-row gap-5 items-center">
        <Image src="/img/google_drive_logo.png" alt="Google Drive folder URL" width={30} height={30} priority/>
        <Input
          type="text"
          id="folderUrl"
          name="folderUrl"
          placeholder='Folder URL'
          className="p-3 bg-white max-w-96"
          disabled={hasFiles}
          onChange={
            (e: ChangeEvent<HTMLInputElement>) => {
              setModifiedSinceError(true);
              setDriveUrl(e.target.value);
            }
          }
        />
      </div>
      <br/>
      <div className="flex flex-row gap-5 items-center">
        <FileUpIcon width={30} height={30} color='white'/>
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          id="files"
          name="files"
          accept=".pdf"
          className="file:bg-white p-1.5 max-w-96"
          disabled={hasLink}
          onChange={
            (e: ChangeEvent<HTMLInputElement>) => {
              setModifiedSinceError(true);
              setFiles(e.target.files);
            }
          }
        />
        {
          hasFiles &&
          <XIcon
            onClick={
              () => {
                setModifiedSinceError(true);
                setFiles(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }
            }
          />
        }
      </div>
      {
        displayError && (
          <div className="items-center justify-center text-red-200">
            <br/>
            { displayError }
          </div>
        )
      }
      <br/>
      <div className="flex flex-row gap-5 items-center">
        <Button
          type="submit"
          className="text-md md:text-lg bg-white text-black"
          disabled={!readyToSubmit}
        >
          Load
        </Button>
        {
          pending && <LoaderCircle className="animate-spin text-white"/>
        }
      </div>
      <FormPendingListener setPending={setPending}/>
    </form>      
  );
}