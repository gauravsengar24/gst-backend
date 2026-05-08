import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { Certificate, CertificateSchema } from './schemas/certificate.schema';
import { MintLog, MintLogSchema } from './schemas/mint-log.schema';
import { Event, EventSchema } from '../events/schemas/event.schema';
import { MetadataModule } from '../metadata/metadata.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Certificate.name, schema: CertificateSchema },
      { name: MintLog.name, schema: MintLogSchema },
      { name: Event.name, schema: EventSchema },
    ]),
    MetadataModule,
    BlockchainModule
  ],
  controllers: [CertificatesController],
  providers: [CertificatesService],
})
export class CertificatesModule {}
