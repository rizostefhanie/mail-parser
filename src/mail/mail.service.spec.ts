import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ParsedMail } from 'mailparser';
import * as fs from 'fs/promises';
import { FileDownloaderService } from '../common/file-downloader.service';
import { pathDownloadEmailExternal } from '../mail/mail.model';

jest.mock('fs/promises');
jest.mock('mailparser', () => ({
  simpleParser: jest.fn(),
}));

describe('MailService', () => {
  let service: MailService;
  let fileDownloaderService: FileDownloaderService;

  const mockFileDownloaderService = {
    downloadJson: jest.fn(),
    downloadEmlFromUrl: jest.fn(),
    downloadWebsiteFromUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: FileDownloaderService,
          useValue: mockFileDownloaderService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    fileDownloaderService = module.get<FileDownloaderService>(FileDownloaderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractUrls', () => {
    it('should extract and filter URLs containing .json', () => {
      const text = 'Check these URLs: https://example.com/data.json, https://test.com/info, www.json-data.com/file.json';
      const result = service.extractUrls(text);
      expect(result.length).toEqual(2);
    });

    it('should return empty array for empty text', () => {
      expect(service.extractUrls('')).toEqual([]);
    });

    it('should remove duplicate URLs', () => {
      const text = 'https://example.com/data.json and again https://example.com/data.json';
      const result = service.extractUrls(text);
      expect(result).toEqual(['https://example.com/data.json']);
    });
  });

  describe('validateType', () => {
    it('should identify URL paths', () => {
      expect(service.validateType('https://example.com/mail.eml')).toBe('url');
    });

    it('should identify Windows file paths', () => {
      expect(service.validateType('C:\\folder\\file.eml')).toBe('path');
      expect(service.validateType('/server/share/file.txt')).toBe('path');
    });

    it('should identify Unix file paths', () => {
      expect(service.validateType('/usr/local/file.eml')).toBe('path');
      expect(service.validateType('./file.txt')).toBe('path');
      expect(service.validateType('../folder/file')).toBe('path');
    });

    it('should identify relative paths', () => {
      expect(service.validateType('folder/file.txt')).toBe('path');
    });

    it('should return empty string for invalid paths', () => {
      expect(service.validateType('invalid:path')).toBe('');
    });
  });

   describe('validateAttachments', () => {
    it('should extract JSON from attachments', () => {
      const mockEmail = {
        attachments: [
          {
            contentType: 'APPLICATION/JSON',
            content: Buffer.from('{"key": "value"}'),
          },
          {
            contentType: 'application/json',
            content: Buffer.from('{"name": "test"}'),
          },
        ],
      } as ParsedMail;

      const result = service.validateAttachments(mockEmail);
      expect(result).toEqual([{ key: 'value' }, { name: 'test' }]);
    });

    it('should return empty array when no attachments', async () => {
      const mockEmail = {
        attachments: [
          {
            contentType: 'APPLICATION/JSON',
            content: Buffer.from('{"key": "value"}'),
          },
          {
            contentType: 'application/json',
            content: Buffer.from('{"name": "test"}'),
          },
        ],
      } as ParsedMail;
      const result = service.validateAttachments(mockEmail);
      expect(result.length).toEqual(2);
    });
  });

  describe('validateContent', () => {
    it('should download JSON from URLs in email text', async () => {
      const fileName = `download_website_0.html`
      const filePath = pathDownloadEmailExternal + fileName;

      mockFileDownloaderService.downloadJson.mockResolvedValue({"name": "testing"});
      mockFileDownloaderService.downloadWebsiteFromUrl.mockResolvedValue({})
      const mockFileContent = Buffer.from('');
      (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
      const mockEmail = {
        text: 'Check this JSON: https://example.com/data.json  and https://example.com/data.html',
      } as ParsedMail;
      const result = await service.validateContent(mockEmail);

      expect(result).toEqual([{"name": "testing"}])
      expect(mockFileDownloaderService.downloadJson).toHaveBeenCalledWith('https://example.com/data.json');
      expect(mockFileDownloaderService.downloadWebsiteFromUrl).toHaveBeenCalledWith(
        'https://example.com/data.html',
        filePath,
        fileName
      );
    });

    it('should return empty array when no URLs found', async () => {
      const mockEmail = {
        text: 'No URLs here',
      } as ParsedMail;
      jest.spyOn(service, 'extractUrls').mockReturnValue([]);

      const result = await service.validateContent(mockEmail);
      expect(result).toEqual([]);
      expect(mockFileDownloaderService.downloadJson).not.toHaveBeenCalled();
    });
  });

  describe('parseEmailFromPath', () => {
    it('should parse email and extract JSON data', async () => {
      const mockEmail = {
        attachments: [
          {
            contentType: 'APPLICATION/JSON',
            content: Buffer.from('{"source": "attachment"}'),
          },
        ],
        text: 'Check this URL: https://example.com/data.json',
      } as ParsedMail;

      const mockFileContent = Buffer.from('email content');
      (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
      (require('mailparser').simpleParser as jest.Mock).mockResolvedValue(mockEmail);

      jest.spyOn(service, 'validateAttachments').mockReturnValue([{ source: 'attachment' }]);
      jest.spyOn(service, 'validateContent').mockResolvedValue([{ source: 'url' }]);

      const result = await service.parseEmailFromPath('path/to/email.eml');

      expect(fs.readFile).toHaveBeenCalledWith('path/to/email.eml');
      expect(require('mailparser').simpleParser).toHaveBeenCalledWith(mockFileContent);
      expect(result).toEqual([
        { source: 'attachment' },
        { source: 'url' }
      ]);
    });
  });

  describe('parseEmailFormUrl', () => {
    it('should download email from URL and parse it', async () => {
      const url = 'https://example.com/email.eml';
      const filePath = pathDownloadEmailExternal+ 'download_email.eml';

      mockFileDownloaderService.downloadEmlFromUrl.mockResolvedValue(true);
      jest.spyOn(service, 'parseEmailFromPath').mockResolvedValue([{ data: 'test' }]);

      const result = await service.parseEmailFormUrl(url);

      expect(mockFileDownloaderService.downloadEmlFromUrl).toHaveBeenCalledWith(
        url,
        filePath,
        'download_email.eml'
      );
      expect(service.parseEmailFromPath).toHaveBeenCalledWith(filePath);
      expect(result).toEqual([{ data: 'test' }]);
    });
  });

  describe('extractData', () => {
    it('should extract data from file path', async () => {
      const filePath = '/path/to/email.eml';

      jest.spyOn(service, 'validateType').mockReturnValue('path');
      jest.spyOn(service, 'parseEmailFromPath').mockResolvedValue([{ data: 'from-path' }]);

      const result = await service.extractData(filePath);

      expect(service.parseEmailFromPath).toHaveBeenCalledWith(filePath);
      expect(result).toEqual([{ data: 'from-path' }]);
    });

    it('should extract data from URL', async () => {
      const url = 'https://example.com/email.eml';

      jest.spyOn(service, 'validateType').mockReturnValue('url');
      jest.spyOn(service, 'parseEmailFormUrl').mockResolvedValue([{ data: 'from-url' }]);

      const result = await service.extractData(url);

      expect(service.parseEmailFormUrl).toHaveBeenCalledWith(url);
      expect(result).toEqual([{ data: 'from-url' }]);
    });

    it('should return error message for invalid path format', async () => {
      const invalidPath = 'invalid:path';

      jest.spyOn(service, 'validateType').mockReturnValue('');

      const result = await service.extractData(invalidPath);

      expect(result).toEqual([{ message: 'Format url not allowed' }]);
    });
  });
})