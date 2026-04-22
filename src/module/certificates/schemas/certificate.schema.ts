import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type CertificateDocument = Certificate & Document;

@Schema({ timestamps: true })
export class Certificate {
  @ApiProperty({ example: 'Web3 Masterclass' })
  @Prop({ required: true })
  title!: string;

  @ApiProperty({ example: 'MST Blockchain' })
  @Prop({ required: true })
  issuer!: string;

  @ApiProperty({ example: '2026-04-22T00:00:00.000Z' })
  @Prop({ type: Date, default: Date.now })
  issuedAt!: Date;

  @ApiProperty({ example: 'Advanced workshop' })
  @Prop()
  description?: string;

  @ApiProperty({ example: 'Participation' })
  @Prop({ required: true })
  type!: string;

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
  @Prop({ type: [{ 
    name: String, 
    email: String, 
    walletAddress: String, 
    localImagePath: String, 
    ipfsHash: String, 
    metadataUrl: String,
    tokenId: Number,
    transactionHash: String
  }] })
  candidates?: { 
    name: string; 
    email?: string; 
    walletAddress: string; 
    localImagePath?: string; 
    ipfsHash?: string; 
    metadataUrl?: string;
    tokenId?: number;
    transactionHash?: string;
  }[];
}

export const CertificateSchema = SchemaFactory.createForClass(Certificate);
