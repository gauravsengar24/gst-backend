import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MintLogDocument = MintLog & Document;

export type MintStatus = 'success' | 'failed' | 'skipped';

@Schema({ timestamps: true })
export class MintLog {
  @Prop({ type: Types.ObjectId, ref: 'Certificate', required: true, index: true })
  certificateId!: Types.ObjectId;

  @Prop({ required: true })
  certificateTitle!: string;

  @Prop()
  eventId?: string;

  /** 'single' for POST /certificates, 'bulk' for POST /certificates/bulk-upload */
  @Prop({ required: true, enum: ['single', 'bulk'] })
  mintType!: 'single' | 'bulk';

  @Prop({ required: true })
  candidateName!: string;

  @Prop()
  candidateEmail?: string;

  @Prop()
  walletAddress?: string;

  @Prop({ required: true, enum: ['success', 'failed', 'skipped'] })
  status!: MintStatus;

  @Prop()
  ipfsImageHash?: string;

  @Prop()
  ipfsMetadataUrl?: string;


  @Prop()
  tokenId?: number;

  @Prop()
  transactionHash?: string;

  @Prop()
  errorMessage?: string;
}

export const MintLogSchema = SchemaFactory.createForClass(MintLog);
