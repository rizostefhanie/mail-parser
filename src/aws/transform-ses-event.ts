import { ApiProperty } from '@nestjs/swagger';

export class TransformSesEvent{
  @ApiProperty({ description: '', example: false })
  spam: boolean
  @ApiProperty({ description: '', example: false })
  virus: boolean
  @ApiProperty({ description: '', example: false })
  dns: boolean
  @ApiProperty({ description: '', example: 'September' })
  mes: string
  @ApiProperty({ description: '', example: false })
  retrasado: boolean
  @ApiProperty({ description: 'Emisor', example: ['61967230-7A45-4A9D-BEC9-87CBCF2211C9'] })
  emisor: string
  @ApiProperty({ description: 'List of receptor', example: ['recipient1','recipient2'] })
  receptor: string[]
}
