import {  Controller, Get, Query } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { DynamicJsonObject } from 'src/mail/mail.model';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { mailExamples } from 'src/swagger/mail-data';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Successfully get info from email',
    type:DynamicJsonObject,
    isArray: true
  })
  @ApiQuery({
    name: 'path',
    required: true,
    description: 'Path or url to email',
      examples: mailExamples
  })
  async getJsonFromMail(@Query('path') path: string): Promise<DynamicJsonObject[]> {
    return await this.mailService.extractData(path)
  }
}
