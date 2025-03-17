import * as path from 'path';

export const pathDownloadEmailExternal = path.join(__dirname, '..', 'files', 'external');
export const pathDownloadEmailInternal = path.join(__dirname, '..', 'files', 'internal');

export const defaultFilenameEmail='download_email.eml'

export class DynamicJsonObject {
  [key: string]: any;
}