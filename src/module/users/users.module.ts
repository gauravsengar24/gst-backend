import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Certificate, CertificateSchema } from '../certificates/schemas/certificate.schema';
import { Event, EventSchema } from '../events/schemas/event.schema';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Certificate.name, schema: CertificateSchema },
      { name: Event.name, schema: EventSchema },
    ]),
    BlockchainModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
