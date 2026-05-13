import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetadataService } from './metadata.service';
import { MetadataController } from './metadata.controller';
import { Certificate, CertificateSchema } from '../certificates/schemas/certificate.schema';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Certificate.name, schema: CertificateSchema }]),
    BlockchainModule
  ],
  providers: [MetadataService],
  controllers: [MetadataController],
  exports: [MetadataService]
})
export class MetadataModule { }
