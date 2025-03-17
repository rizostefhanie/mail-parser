import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ParsedMail, simpleParser } from 'mailparser';
import {
  defaultFilenameEmail,
  DynamicJsonObject,
  pathDownloadEmailExternal,
} from '../mail/mail.model';
import * as path from 'node:path';
import { FileDownloaderService } from '../common/file-downloader.service';
import * as fs from 'fs/promises';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly fileDownloaderService: FileDownloaderService) {}

  async getParseEmailFromPath(filePath: string): Promise<ParsedMail> {
    try {
      // Check if file exists first
      await fs.access(filePath);
      // Read the file content
      const fileContent = await fs.readFile(filePath);
      // Parse the email content
      return await simpleParser(fileContent);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new HttpException(`File does not exist: ${filePath}`, 404);
      }
      throw new HttpException(error.message, 500);
    }
  }

  //Read Emails and validate attachment and content if contains json file or json url's
  async parseEmailFromPath(filePath: string): Promise<DynamicJsonObject[]> {
    const json: DynamicJsonObject[] = [];
    const emailParsed = await this.getParseEmailFromPath(filePath);
    // Extract json from attachments
    const attachment: DynamicJsonObject[] =
      this.validateAttachments(emailParsed);
    if (attachment) json.push(...attachment);
    // Search url in body mail and get json from url
    const content = await this.validateContent(emailParsed);
    if (content) json.push(...content);
    await this.deleteAllFiles();
    return json;
  }

  async deleteAllFiles() {
    try {
      for (const file of await fs.readdir(pathDownloadEmailExternal)) {
        await fs.unlink(path.join(pathDownloadEmailExternal, file));
      }
    } catch (e) {
      this.logger.log('There are not files to delete.');
    }
  }

  validateAttachments(email: ParsedMail): DynamicJsonObject[] {
    // Process json attachments exist
    if (email.attachments && email.attachments.length > 0) {
      const emailsWithJsonAttachment = email.attachments.filter(
        (attachment) =>
          attachment.contentType.trim().toUpperCase() === 'APPLICATION/JSON',
      );
      if (emailsWithJsonAttachment.length > 0) {
        return emailsWithJsonAttachment.flatMap((emailWithJsonAttachment) => {
          const jsonString = emailWithJsonAttachment.content.toString('utf8');
          return JSON.parse(jsonString);
        });
      }
    }
    return [];
  }

  async getJsonUrls(urls: string[]): Promise<DynamicJsonObject[]> {
    const promises: Promise<any>[] = [];
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      promises.push(this.fileDownloaderService.downloadJson(url));
    }
    return await Promise.all(promises);
  }
  async getWebUrls(emailContent: string): Promise<DynamicJsonObject[]> {
    const urls = this.extractUrls(emailContent, false);
    const promises: Promise<any>[] = [];
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const fileName = `download_website_${i}.html`;
      const filePath = pathDownloadEmailExternal + fileName;
      promises.push(
        this.fileDownloaderService.downloadWebsiteFromUrl(
          url,
          filePath,
          fileName,
        ),
      );
    }
    const urlsFromWebsite: string[] = [];
    const allResponse = await Promise.all(promises);
    for (let j = 0; j < allResponse.length; j++) {
      const filePath = pathDownloadEmailExternal + `download_website_${j}.html`;
      const fileContent: string = (await fs.readFile(filePath)).toString();
      const urlsResponse: string[] = this.extractUrls(fileContent);
      urlsFromWebsite.push(...urlsResponse);
    }
    return await this.getJsonUrls(urlsFromWebsite);
  }
  async validateContent(email: ParsedMail): Promise<DynamicJsonObject[]> {
    const resp: DynamicJsonObject[] = [];
    if (email.text) {
      const jsonUrls = this.extractUrls(email.text);
      const [jsonFromUrls, jsonFromWeb] = await Promise.all([
        this.getJsonUrls(jsonUrls),
        this.getWebUrls(email.text),
      ]);
      resp.push(...jsonFromUrls);
      resp.push(...jsonFromWeb);
    }
    return resp;
  }

  extractUrls(text: string, jsonFilter: boolean = true): string[] {
    if (!text) return [];

    // Modified regex to exclude square brackets from the matched URL
    const urlRegex = /(https?:\/\/[^\s<>"'\[\]]+|www\.[^\s<>"'\[\]]+)/g;
    const matches = text.match(urlRegex) || [];

    // Filter and clean URLs
    const resp = [...new Set(matches)].map((url: string) => {
      if (url.startsWith('www.')) return 'https://' + url;
      return String(url);
    });
    if (jsonFilter) return resp.filter((url) => url.includes('.json'));
    return resp.filter((url) => !url.includes('.json'));
  }

  async parseEmailFormUrl(decodeUrl: string): Promise<DynamicJsonObject[]> {
    const filePath = pathDownloadEmailExternal + defaultFilenameEmail;
    // Download the file
    await this.fileDownloaderService.downloadEmlFromUrl(
      decodeUrl,
      filePath,
      defaultFilenameEmail,
    );

    return await this.parseEmailFromPath(filePath);
  }

  async extractData(path: string): Promise<DynamicJsonObject[]> {
    const isvalidPath = this.validateType(path);
    switch (isvalidPath) {
      case 'path':
        return await this.parseEmailFromPath(path);
      case 'url':
        return await this.parseEmailFormUrl(path);
      default:
        return [
          {
            message: 'Format url not allowed',
          },
        ];
    }
  }
  validateType(path: string): string {
    // Check if a Windows paths like C:\folder\file.txt or \\server\share\file.txt
    const windowsPathPattern =
      /^([a-zA-Z]:\\|\\\\)[^\\/:*?"<>|]+([\\][^\\/:*?"<>|]+)*\\?$/;

    //Check if a Unix paths like /usr/local/file.txt or ./file.txt or ../folder/file
    const unixPathPattern =
      /^(\/|\.\/|\.\.\/)[^\\/:*?"<>|]+([\/][^\\/:*?"<>|]+)*\/?$/;

    //Check if a Relative paths like folder/file.txt
    const relativePathPattern = /^[^\\/:*?"<>|]+([\/\\][^\\/:*?"<>|]+)*\/?$/;

    const isWindowsPath = windowsPathPattern.test(path);
    const isUnixPath = unixPathPattern.test(path);
    const isRelativePath = relativePathPattern.test(path);
    if (isWindowsPath || isUnixPath || isRelativePath) return 'path';
    try {
      new URL(path);
      // If it doesn't throw, it's a valid URL format
      if (path.includes('.eml')) {
        return 'url';
      }
    } catch (e) {}
    return '';
  }
}