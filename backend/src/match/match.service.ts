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
import { Model, Types } from 'mongoose';
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
    const match = await this.matchModel
      .findById(dto.matchId)
      .populate('teamA teamB');
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    if (match.status === MatchStatus.COMPLETED) {
      throw new BadRequestException('Match is already completed');
    }

    // Validate wicket types on extras
    if (dto.isWicket && dto.extraType === 'WIDE') {
      if (
        dto.wicketType &&
        dto.wicketType !== 'RUN_OUT' &&
        dto.wicketType !== 'STUMPED'
      ) {
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

      // Set batting team for each innings based on toss, or default to teamA first
      if (!match.innings1.battingTeamId) {
        const teamAId = match.teamA._id.toString();
        const teamBId = match.teamB._id.toString();

        if (match.tossWinner && match.tossDecision) {
          const tossWinnerId = match.tossWinner.toString();
          if (match.tossDecision === 'BAT') {
            match.innings1.battingTeamId = tossWinnerId;
            match.innings2.battingTeamId =
              tossWinnerId === teamAId ? teamBId : teamAId;
          } else {
            match.innings1.battingTeamId =
              tossWinnerId === teamAId ? teamBId : teamAId;
            match.innings2.battingTeamId = tossWinnerId;
          }
        } else {
          match.innings1.battingTeamId = teamAId;
          match.innings2.battingTeamId = teamBId;
        }
      }
    }

    const inningsKey = match.currentInnings === 1 ? 'innings1' : 'innings2';
    const innings: InningsScoreCard = match[inningsKey];

    const isLegalDelivery =
      !dto.extraType ||
      (dto.extraType !== 'WIDE' && dto.extraType !== 'NO_BALL');

    // OVERRIDE current striker/non-striker/bowler with the DTO values from the frontend
    // This allows the frontend to manually override the striker (e.g. after a wicket or mistake)
    if (dto.batsmanName) innings.striker = dto.batsmanName;
    if (dto.nonStrikerName) innings.nonStriker = dto.nonStrikerName;
    if (dto.bowlerName) innings.bowler = dto.bowlerName;

    const totalRuns = dto.runs + (dto.extras || 0);

    innings.score += totalRuns;
    innings.extras += dto.extras || 0;

    if (isLegalDelivery) {
      innings.ballsInCurrentOver += 1;
    }

    if (dto.isWicket) {
      innings.wickets += 1;

      // Clear the dismissed player so the scorer is forced to enter the new batsman
      if (dto.dismissedPlayer === innings.striker) {
        innings.striker = '';
      } else if (dto.dismissedPlayer === innings.nonStriker) {
        innings.nonStriker = '';
      } else {
        innings.striker = ''; // Fallback
      }
    }

    const ballNumber = innings.ballsInCurrentOver;

    let overComplete = false;
    if (innings.ballsInCurrentOver >= 6) {
      innings.overs += 1;
      innings.ballsInCurrentOver = 0;
      overComplete = true;

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

    // 1. Rotate striker on odd runs for legal deliveries
    if (isLegalDelivery && dto.runs % 2 !== 0) {
      const temp = innings.striker;
      innings.striker = innings.nonStriker;
      innings.nonStriker = temp;
    }

    // 2. Rotate strike at end of over
    if (overComplete) {
      const temp = innings.striker;
      innings.striker = innings.nonStriker;
      innings.nonStriker = temp;
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

    // ===== AUTO-SET WINNER & RESULT SUMMARY =====
    if (match.status === MatchStatus.COMPLETED) {
      const teamAId = match.teamA._id.toString();
      const teamBId = match.teamB._id.toString();
      const teamAName = (match.teamA as any).name || 'Team A';
      const teamBName = (match.teamB as any).name || 'Team B';

      const battingFirstId = match.innings1.battingTeamId;
      const battingSecondId = match.innings2.battingTeamId;

      const battingFirstName =
        battingFirstId === teamAId ? teamAName : teamBName;
      const battingSecondName =
        battingSecondId === teamAId ? teamAName : teamBName;

      const score1 = match.innings1.score;
      const score2 = match.innings2.score;

      if (score2 > score1) {
        // Chasing team won
        const wicketsLeft = 10 - match.innings2.wickets;
        match.winner =
          battingSecondId === teamAId ? match.teamA._id : match.teamB._id;
        match.resultSummary = `${battingSecondName} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
      } else if (score1 > score2) {
        // Batting-first team won
        const runMargin = score1 - score2;
        match.winner =
          battingFirstId === teamAId ? match.teamA._id : match.teamB._id;
        match.resultSummary = `${battingFirstName} won by ${runMargin} run${runMargin !== 1 ? 's' : ''}`;
      } else {
        // Tie
        match.winner = null as any;
        match.resultSummary = 'Match Tied';
      }
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
      winner: match.winner,
      resultSummary: match.resultSummary,
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

  async setToss(matchId: string, tossWinnerId: string, tossDecision: 'BAT' | 'BOWL') {
    const match = await this.matchModel.findById(matchId);
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    match.tossWinner = new Types.ObjectId(tossWinnerId);
    match.tossDecision = tossDecision;
    match.status = MatchStatus.LIVE;

    const teamAId = match.teamA.toString();
    const teamBId = match.teamB.toString();

    if (tossDecision === 'BAT') {
      match.innings1.battingTeamId = tossWinnerId;
      match.innings2.battingTeamId = tossWinnerId === teamAId ? teamBId : teamAId;
    } else {
      match.innings1.battingTeamId = tossWinnerId === teamAId ? teamBId : teamAId;
      match.innings2.battingTeamId = tossWinnerId;
    }

    // Set active team on live scorecard
    match.liveScorecard.currentInnings = 1;
    match.liveScorecard.battingTeam = match.innings1.battingTeamId;

    return await match.save();
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
