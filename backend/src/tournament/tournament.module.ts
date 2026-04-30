import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Team, TeamSchema } from './schemas/team.schema';
import { TournamentController } from './tournament.controller';
import { TournamentService } from './tournament.service';
import { User, UserSchema } from 'src/auth/user.schema';
import { Match, MatchSchema } from 'src/match/schemas/match.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Team.name, schema: TeamSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Match.name, schema: MatchSchema }]),
  ],
  controllers: [TournamentController],
  providers: [TournamentService],
})
export class TournamentModule {}
