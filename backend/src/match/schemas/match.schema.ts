import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
}

export interface BallEvent {
  innings: number;
  over: number;
  ball: number;
  batsmanName: string;
  bowlerName: string;
  runs: number;
  extras: number;
  extraType?: 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE' | null;
  isWicket: boolean;
  wicketType?:
    | 'BOWLED'
    | 'CAUGHT'
    | 'LBW'
    | 'RUN_OUT'
    | 'STUMPED'
    | 'HIT_WICKET'
    | null;
  dismissedPlayer?: string;
  timestamp?: Date;
}

export interface InningsScoreCard {
  battingTeamId: string;
  score: number;
  wickets: number;
  overs: number;
  ballsInCurrentOver: number;
  striker: string;
  nonStriker: string;
  bowler: string;
  extras: number;
}

@Schema({ timestamps: true })
export class Match extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  teamA: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  teamB: Types.ObjectId;

  @Prop({ required: true, enum: MatchStatus, default: MatchStatus.SCHEDULED })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Team' })
  tossWinner: Types.ObjectId;

  @Prop({ enum: ['BAT', 'BOWL'] })
  tossDecision: string;

  @Prop({ type: Types.ObjectId, ref: 'Team' })
  winner: Types.ObjectId;

  @Prop()
  resultSummary: string;

  @Prop({ default: 20 })
  totalOvers: number;

  @Prop({ type: Date, default: Date.now })
  date: Date;

  @Prop({ type: Number, default: 1 })
  currentInnings: number;

  // First innings scorecard
  @Prop({
    type: Object,
    default: {
      battingTeamId: null,
      score: 0,
      wickets: 0,
      overs: 0,
      ballsInCurrentOver: 0,
      striker: '',
      nonStriker: '',
      bowler: '',
      extras: 0,
    },
  })
  innings1: InningsScoreCard;

  // Second innings scorecard
  @Prop({
    type: Object,
    default: {
      battingTeamId: null,
      score: 0,
      wickets: 0,
      overs: 0,
      ballsInCurrentOver: 0,
      striker: '',
      nonStriker: '',
      bowler: '',
      extras: 0,
    },
  })
  innings2: InningsScoreCard;

  // Ball-by-ball log
  @Prop({ type: [Object], default: [] })
  ballLog: BallEvent[];

  @Prop({
    type: Object,
    default: {
      currentInnings: 1,
      battingTeam: null,
      score: 0,
      wickets: 0,
      overs: 0,
      ballsInCurrentOver: 0,
      striker: '',
      nonStriker: '',
      bowler: '',
    },
  })
  liveScorecard: Record<string, any>;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
