import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { TournamentModule } from './tournament/tournament.module';
import { MatchModule } from './match/match.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    TournamentModule,
    MatchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
