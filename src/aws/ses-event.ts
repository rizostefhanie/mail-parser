import { ApiProperty } from '@nestjs/swagger';

export class SesHeaderDto {
  name: string;
  value: string;
}

export class SesCommonHeadersDto {
  returnPath: string;
  from: string[];
  date: string;
  to: string[];
  messageId: string;
  subject: string;
}

export class SesMailDto {
  timestamp: string;
  source: string;
  messageId: string;
  destination: string[];
  headersTruncated: boolean;
  headers: SesHeaderDto[];
  commonHeaders: SesCommonHeadersDto;
}

export class SesVerdictDto {
  @ApiProperty({  example: "PASS" })
  status: string;
}

export class SesActionDto {
  @ApiProperty({  example: "SNS" })
  type: string;
  @ApiProperty({  example: "arn:aws:sns:us-east-1:012345678912:example-topic" })
  topicArn: string;
}

export class SesReceiptDto {
  @ApiProperty({  example: "2015-09-11T20:32:33.936Z" })
  timestamp: string;
  @ApiProperty({  example: 22 })
  processingTimeMillis: number;
  @ApiProperty({  example:["recipient@example.com"] })
  recipients: string[];
  @ApiProperty({ type: SesVerdictDto })
  spamVerdict: SesVerdictDto;
  @ApiProperty({ type: SesVerdictDto })
  virusVerdict: SesVerdictDto;
  @ApiProperty({ type: SesVerdictDto })
  spfVerdict: SesVerdictDto;
  @ApiProperty({ type: SesVerdictDto })
  dkimVerdict: SesVerdictDto;
  @ApiProperty({ type: SesVerdictDto })
  dmarcVerdict: SesVerdictDto;
  @ApiProperty({  example: "reject" })
  dmarcPolicy: string;
  @ApiProperty({ type: SesActionDto })
  action: SesActionDto;
}

export class SesDto {
  @ApiProperty({ type: SesReceiptDto})
  receipt: SesReceiptDto;
  @ApiProperty({ type: SesMailDto})
  mail: SesMailDto;
}

export class SesRecordDto {
  @ApiProperty({  example: "1.0" })
  eventVersion: string;
  @ApiProperty({ type: SesDto })
  ses: SesDto;
  @ApiProperty({  example: "aws:ses" })
  eventSource: string;
}

export class SesEvent {
  @ApiProperty({
    description: 'Array of SES notification records',
    type: [SesRecordDto],
    name: 'Records'
  })
  Records: SesRecordDto[];
}
