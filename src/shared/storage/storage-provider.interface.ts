export interface UploadedFileInput {
  filename: string;
  buffer: Buffer;
  mimeType: string;
}

export interface StorageProvider {
  /** Saves a file under `directory` and returns the public URL/path to it. */
  upload(directory: string, file: UploadedFileInput): Promise<string>;

  /** Deletes a previously uploaded file, given the value returned by `upload`. */
  delete(url: string): Promise<void>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
