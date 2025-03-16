import { Body, Controller, Get, Post } from '@nestjs/common';
import { SesService } from 'src/aws/ses-event.service';
import { TransformSesEvent } from 'src/aws/transform-ses-event';
import { SesEvent } from 'src/aws/ses-event';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import {  sesRecordExamples } from 'src/swagger/ses-event-data';

@Controller('ses-event')
export class SesEventController {
  constructor(private readonly sesService: SesService) {}

  @Post()
  @ApiResponse({
    status: 200,
    description: 'Successfully parse ses info',
    type: TransformSesEvent,
    isArray: true
  })
  @ApiBody({
    required: true,
    examples: {
      rawEvent: {
        summary: '',
        description: '',
        value :sesRecordExamples
      }
    }
  })
  transformSesEvent(@Body() rawEvent: SesEvent): TransformSesEvent[] {
    return this.sesService.processEvent(rawEvent)
  }
}
