import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  name!: string;

  @Prop()
  level!: string;

  @Prop()
  description!: string;

  @Prop({ required: true })
  date!: Date;

  @Prop({ required: true })
  place!: string;

  @Prop()
  baseCertificatePath?: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);
