'use client'

import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import Image from 'next/image';
import { FileUpIcon, XIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { hasFolderId, uploadedFilesTooLarge, MAX_UPLOADED_FILE_SIZE_KB } from '@/lib/InputHelpers';

interface FilesFormProps {
    submitForm: (formData: FormData) => void;
    error?: string;
}

export default function FilesForm({ submitForm, error }: FilesFormProps) {
  const [driveUrl, setDriveUrl] = useState<string>('');
  const [files, setFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modified, setModified] = useState<boolean>(false);

  let displayError: string | undefined = modified ? undefined : error;

  const hasLink = driveUrl.length > 0;
  const hasValidLink = hasLink && hasFolderId(driveUrl);
  const hasFiles = !!(files && files.length > 0);
  const tooLarge = hasFiles && uploadedFilesTooLarge(files);
  if (tooLarge) {
    displayError = `File size exceeded maximum of ${MAX_UPLOADED_FILE_SIZE_KB} KB`;
  }
  const hasValidFiles = hasFiles && !tooLarge;
  const readyToSubmit = hasValidLink || hasValidFiles;

  if (displayError) {
    console.info(`Displaying form validation error on client: ${displayError}`);
  }

  return (
    <form action={submitForm}>
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
              setModified(true);
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
              setModified(true);
              setFiles(e.target.files);
            }
          }
        />
        {
          hasFiles &&
          <XIcon
            onClick={
              () => {
                setModified(true);
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
      <Button
        type="submit"
        className="text-md md:text-lg bg-white text-black"
        disabled={!readyToSubmit}
      >
        Load
      </Button>
    </form>      
  );
}