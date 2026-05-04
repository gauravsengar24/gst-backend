import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type CertificateDocument = Certificate & Document;

@Schema()
export class Candidate {
  @ApiProperty({ example: '662768... (Candidate Object ID)' })
  _id!: string;

  @ApiProperty({ example: 'John Doe' })
  @Prop({ required: true })
  name!: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @Prop()
  email?: string;

  @ApiProperty({ example: '0x123...' })
  @Prop({ required: true })
  walletAddress!: string;

  @ApiProperty({ example: 'Participation' })
  @Prop({ required: true })
  type!: string;

  @ApiProperty({ required: false })
  @Prop()
  localImagePath?: string;

  @ApiProperty({ required: false })
  @Prop()
  ipfsHash?: string;

  @ApiProperty({ required: false })
  @Prop()
  metadataUrl?: string;

  @ApiProperty({ required: false })
  @Prop()
  tokenId?: number;

  @ApiProperty({ required: false })
  @Prop()
  transactionHash?: string;
}

const CandidateSchema = SchemaFactory.createForClass(Candidate);

@Schema({ timestamps: true })
export class Certificate {
  @ApiProperty({ example: 'Web3 Masterclass' })
  @Prop({ required: true })
  title!: string;

  @ApiProperty({ example: 'MST Blockchain' })
  @Prop({ required: true })
  issuingAuthority!: string;

  @ApiProperty({ example: '2026-04-22T00:00:00.000Z' })
  @Prop({ type: Date, default: Date.now })
  issuedAt!: Date;

  @ApiProperty({ example: 'Advanced workshop' })
  @Prop()
  description?: string;

  @ApiProperty({ example: 'event123', required: false })
  @Prop({ type: String })
  eventId?: string;

  @ApiProperty({ required: false })
  @Prop()
  ipfsHash?: string;

  @ApiProperty({ required: false })
  @Prop()
  metadataUrl?: string;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  @Prop({ type: [CandidateSchema] })
  candidates?: Candidate[];
}

export const CertificateSchema = SchemaFactory.createForClass(Certificate);
