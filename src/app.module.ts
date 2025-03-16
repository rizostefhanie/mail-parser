import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SesEventController } from 'src/aws/ses-event.controller';
import { SesService } from 'src/aws/ses-event.service';
import { MailController } from 'src/mail/mail.controller';
import { MailService } from 'src/mail/mail.service';
import { FileDownloaderService } from 'src/common/file-downloader.service';

@Module({
  imports: [],
  controllers: [AppController,SesEventController, MailController],
  providers: [AppService, SesService, MailService,FileDownloaderService],
  exports: [FileDownloaderService],
})
export class AppModule {}
