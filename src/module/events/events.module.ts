import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event, EventSchema } from './schemas/event.schema';
import { Certificate, CertificateSchema } from '../certificates/schemas/certificate.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Certificate.name, schema: CertificateSchema }
    ])
  ],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
