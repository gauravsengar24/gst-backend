import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CertificateDocument = Certificate & Document;

@Schema({ timestamps: true })
export class Certificate {
  @Prop()
  recipientName?: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  issuer!: string;

  @Prop({ type: Date, default: Date.now })
  issuedAt!: Date;

  @Prop()
  description?: string;

  @Prop({ required: true })
  type!: string;

  @Prop({ type: String })
  eventId?: string;

  @Prop()
  ipfsHash?: string;

  @Prop()
  metadataUrl?: string;

  @Prop({ type: [{ name: String, email: String, walletAddress: String, localImagePath: String, ipfsHash: String, metadataUrl: String }] })
  candidates?: { name: string; email?: string; walletAddress: string; localImagePath?: string; ipfsHash?: string; metadataUrl?: string }[];
}

export const CertificateSchema = SchemaFactory.createForClass(Certificate);
