import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'Certificate of Participation' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Tech Conference 2026' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'National' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiProperty({ example: 'Annual technology conference for developers.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-06-15T09:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 'Mumbai, Maharashtra' })
  @IsNotEmpty()
  @IsString()
  place!: string;
}
