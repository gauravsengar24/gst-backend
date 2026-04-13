import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { Certificate, CertificateSchema } from './schemas/certificate.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Certificate.name, schema: CertificateSchema }])],
  controllers: [CertificatesController],
  providers: [CertificatesService],
})
export class CertificatesModule {}
