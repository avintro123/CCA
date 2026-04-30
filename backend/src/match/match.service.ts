import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  BallEvent,
  InningsScoreCard,
  Match,
  MatchStatus,
} from './schemas/match.schema';
import { Model } from 'mongoose';
import { CreateMatchDto } from './dto/create-match.dto';
import { RecordBallDto } from './dto/record-ball.dto';

@Injectable()
export class MatchService {
  constructor(@InjectModel(Match.name) private matchModel: Model<Match>) {}

  async createMatch(createMatchDto: CreateMatchDto) {
    if (createMatchDto.teamA === createMatchDto.teamB) {
      throw new BadRequestException('A team cannot play against itself');
    }

    const newMatch = new this.matchModel(createMatchDto);
    return await newMatch.save();
  }

  async getAllMatches() {
    return this.matchModel.find().populate('teamA teamB tossWinner').exec();
  }

  async getMatchById(matchId: string) {
    const match = await this.matchModel
      .findById(matchId)
      .populate('teamA teamB tossWinner')
      .exec();
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    return match;
  }

  async recordBall(dto: RecordBallDto) {
    const match = await this.matchModel.findById(dto.matchId);
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    if (match.status === MatchStatus.COMPLETED) {
      throw new BadRequestException('Match is already completed');
    }

    // Validate wicket types on extras
    if (dto.isWicket && dto.extraType === 'WIDE') {
      if (dto.wicketType && dto.wicketType !== 'RUN_OUT' && dto.wicketType !== 'STUMPED') {
        throw new BadRequestException(
          'Only RUN_OUT and STUMPED are valid dismissals on a wide ball',
        );
      }
    }
    if (dto.isWicket && dto.extraType === 'NO_BALL') {
      if (dto.wicketType && dto.wicketType !== 'RUN_OUT') {
        throw new BadRequestException(
          'Only RUN_OUT is a valid dismissal on a no-ball',
        );
      }
    }

    if (match.status === MatchStatus.SCHEDULED) {
      match.status = MatchStatus.LIVE;
    }

    const inningsKey = match.currentInnings === 1 ? 'innings1' : 'innings2';
    const innings: InningsScoreCard = match[inningsKey];

    const isLegalDelivery =
      !dto.extraType ||
      (dto.extraType !== 'WIDE' && dto.extraType !== 'NO_BALL');

    const totalRuns = dto.runs + (dto.extras || 0);

    innings.score += totalRuns;
    innings.extras += dto.extras || 0;

    if (isLegalDelivery) {
      innings.ballsInCurrentOver += 1;
    }

    // Track whether a wicket fell on this ball (for strike rotation logic)
    const wicketFell = dto.isWicket;

    if (dto.isWicket) {
      innings.wickets += 1;

      // Update striker if new batsman is provided
      if (dto.newStriker) {
        if (dto.dismissedPlayer === innings.striker) {
          innings.striker = dto.newStriker;
        } else if (dto.dismissedPlayer === innings.nonStriker) {
          innings.nonStriker = dto.newStriker;
        }
      }
    }

    // Capture ball number BEFORE the over-complete reset
    const ballNumber = innings.ballsInCurrentOver;

    let overComplete = false;
    if (innings.ballsInCurrentOver >= 6) {
      innings.overs += 1;
      innings.ballsInCurrentOver = 0;
      overComplete = true;

      // Rotate strike at end of over — but NOT if a wicket fell on this ball
      // and the striker was dismissed (new batsman already replaced them,
      // a blind swap would put them at the wrong end)
      if (!wicketFell) {
        const temp = innings.striker;
        innings.striker = innings.nonStriker;
        innings.nonStriker = temp;
      }

      // Update bowler if new bowler is provided
      if (dto.newBowler) {
        innings.bowler = dto.newBowler;
      }
    }

    // Create the ball event log entry
    const ballEvent: BallEvent = {
      innings: match.currentInnings,
      over: overComplete ? innings.overs - 1 : innings.overs,
      ball: overComplete ? 6 : ballNumber,
      batsmanName: dto.batsmanName,
      bowlerName: dto.bowlerName,
      runs: dto.runs,
      extras: dto.extras || 0,
      extraType: (dto.extraType as any) || null,
      isWicket: dto.isWicket || false,
      wicketType: (dto.wicketType as any) || null,
      dismissedPlayer: (dto.dismissedPlayer as any) || null,
      timestamp: new Date(),
    };

    match.ballLog.push(ballEvent);

    // Rotate striker on odd runs — only if over did not complete
    if (!overComplete && isLegalDelivery && dto.runs % 2 !== 0) {
      const temp = innings.striker;
      innings.striker = innings.nonStriker;
      innings.nonStriker = temp;
    }

    // Update batsman/bowler names from the DTO
    if (!innings.striker || innings.striker === '') {
      innings.striker = dto.batsmanName;
    }
    // Only set bowler from DTO if the over didn't just complete
    // (otherwise newBowler was already set above and we don't want to overwrite it)
    if (!overComplete) {
      innings.bowler = dto.bowlerName;
    }

    // Check if innings is over (all out or overs finished)
    const allOut = innings.wickets >= 10;
    const oversFinished = innings.overs >= match.totalOvers;

    if (allOut || oversFinished) {
      if (match.currentInnings === 1) {
        // Switch to 2nd innings
        match.currentInnings = 2;
      } else {
        // 2nd innings is done — auto-complete the match
        match.status = MatchStatus.COMPLETED;
      }
    }

    // Check if chasing team has passed the target (2nd innings only)
    if (
      match.currentInnings === 2 &&
      match.innings1.score > 0 &&
      innings.score > match.innings1.score
    ) {
      match.status = MatchStatus.COMPLETED;
    }

    match.liveScorecard = {
      currentInnings: match.currentInnings,
      battingTeam: innings.battingTeamId,
      score: innings.score,
      wickets: innings.wickets,
      overs: innings.overs,
      ballsInCurrentOver: innings.ballsInCurrentOver,
      striker: innings.striker,
      nonStriker: innings.nonStriker,
      bowler: innings.bowler,
      inningsComplete: allOut || oversFinished,
    };

    // Save everything
    match[inningsKey] = innings;
    match.markModified('innings1');
    match.markModified('innings2');
    match.markModified('ballLog');
    match.markModified('liveScorecard');

    await match.save();

    return {
      ball: ballEvent,
      innings1: match.innings1,
      innings2: match.innings2,
      currentInnings: match.currentInnings,
      status: match.status,
      liveScorecard: match.liveScorecard,
    };
  }

  async updateLiveScore(matchId: string, scoreData: any) {
    const match = await this.matchModel.findByIdAndUpdate(
      matchId,
      { $set: { liveScorecard: scoreData } },
      { returnDocument: 'after' },
    );
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    return match.liveScorecard;
  }

  async completeMatch(
    matchId: string,
    winnerId: string,
    resultSummary: string,
  ) {
    const match = await this.matchModel.findByIdAndUpdate(
      matchId,
      {
        $set: {
          status: MatchStatus.COMPLETED,
          winner: winnerId,
          resultSummary: resultSummary,
        },
      },
      { returnDocument: 'after' },
    );
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    return match;
  }

  // helper: get ball for a specific match
  async getBallLog(matchId: string) {
    const match = await this.matchModel
      .findById(matchId)
      .select('ballLog innings1 innings2 currentInnings');

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return {
      ballLog: match.ballLog,
      innings1: match.innings1,
      innings2: match.innings2,
      currentInnings: match.currentInnings,
    };
  }
}
