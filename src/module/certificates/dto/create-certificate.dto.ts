import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateCertificateDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  recipientName!: string;

  @ApiProperty({ example: 'Participation' })
  @IsNotEmpty()
  @IsString()
  type!: string;

  @ApiProperty({ example: 'Participation Certificate' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 'CertifyMe' })
  @IsNotEmpty()
  @IsString()
  issuer!: string;

  @ApiProperty({ example: '2026-04-13T00:00:00Z', required: false, description: 'Issue date; auto-generated if omitted' })
  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @ApiProperty({ example: 'Awarded for participation in the annual hackathon', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
