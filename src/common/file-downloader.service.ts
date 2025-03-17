import { HttpException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import axios  from 'axios';

@Injectable()
export class FileDownloaderService {

  constructor() {}

  async downloadEmlFromUrl(url: string, filePath: string, fileName: string ): Promise<{
    originalUrl: string;
    fileName: string;
    filePath: string;
    size: number;
  }> {
    try {
      const response = await axios.get(url, {
        responseType: 'text',
        headers: {
          Accept: 'message/rfc822',
        },
      });
      // Save the file
      await fs.promises.writeFile(filePath, response.data);

      return {
        originalUrl: url,
        fileName,
        filePath,
        size: Buffer.from(response.data).length,
      };
    } catch (error) {
      throw new HttpException(`Failed to download EML file: ${error.message}`, 500);
    }
  }
  async downloadJson(url: string){
    const response = await axios.get(url);
    return response.data
  }
  async downloadWebsiteFromUrl(url: string, filePath: string, fileName: string ){
    try {
      const response = await axios.get(url,{
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        responseType: 'text',
        timeout: 10000 // 10 seconds timeout
      } );
      // Save the file
      await fs.promises.writeFile(filePath, response.data);

      return {
        originalUrl: url,
        fileName,
        filePath,
        size: Buffer.from(response.data).length,
      };
    } catch (error) {
      throw new HttpException(`Failed to download Website file: ${error.message}`, 500);
    }
  }
}