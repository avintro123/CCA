import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { Match, MatchSchema } from './schemas/match.schema';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';
import { MatchGateway } from './match.gateway';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Match.name, schema: MatchSchema }]),
    AuthModule,
    HttpModule,
  ],
  controllers: [MatchController],
  providers: [MatchService, MatchGateway],
})
export class MatchModule {}
