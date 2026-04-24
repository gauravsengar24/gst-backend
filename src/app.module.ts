import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
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
import { UsersModule } from './module/users/users.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    AdminModule,
    EventsModule,
    CertificatesModule,
    CandidatesModule,
    BlockchainModule,
    MetadataModule,
    DashboardModule,
    UsersModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
