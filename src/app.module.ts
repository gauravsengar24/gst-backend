import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './module/auth/auth.module';
import { DashboardModule } from './module/dashboard/dashboard.module';
import { MetadataModule } from './module/metadata/metadata.module';
import { BlockchainModule } from './module/blockchain/blockchain.module';
import { CandidatesModule } from './module/candidates/candidates.module';
import { CertificatesModule } from './module/certificates/certificates.module';
import { EventsModule } from './module/events/events.module';
import { AdminModule } from './module/admin/admin.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [AuthModule, AdminModule, EventsModule, CertificatesModule, CandidatesModule, BlockchainModule, MetadataModule, DashboardModule, ConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
