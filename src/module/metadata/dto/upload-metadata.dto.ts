import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadMetadataDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Successful completion of workshop' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({ example: '2026-04-21' })
  @IsNotEmpty()
  @IsString()
  date!: string;

  @ApiProperty({ example: 'Masterstroke Academy' })
  @IsNotEmpty()
  @IsString()
  issuedBy!: string;

  @ApiProperty({ example: 'Blockchain Fundamental' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Workshop' })
  @IsNotEmpty()
  @IsString()
  type!: string;

  @ApiProperty({ example: 'Intermediate' })
  @IsString()
  level?: string;

  @ApiProperty({ example: '0x123...', required: true })
  @IsNotEmpty()
  @IsString()
  walletAddress!: string;

  @ApiProperty({ example: '0xabc...', required: false })
  @IsString()
  transactionHash?: string;
}
