import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class RecordBallDto {
  @IsString()
  @IsNotEmpty()
  matchId: string;

  @IsString()
  @IsNotEmpty()
  bowlerName: string;

  @IsString()
  @IsNotEmpty()
  batsmanName: string;

  @IsOptional()
  @IsString()
  nonStrikerName?: string;

  @IsNumber()
  @Min(0)
  @Max(6)
  runs: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  extras: number;

  @IsOptional()
  @IsEnum(['WIDE', 'NO_BALL', 'BYE', 'LEG_BYE'])
  extraType?: string;

  @IsBoolean()
  isWicket: boolean;

  @IsOptional()
  @IsEnum(['BOWLED', 'CAUGHT', 'LBW', 'RUN_OUT', 'STUMPED', 'HIT_WICKET'])
  wicketType?: string;

  @IsOptional()
  @IsString()
  dismissedPlayer?: string;

  @IsOptional()
  @IsString()
  newStriker?: string;

  @IsOptional()
  @IsString()
  newBowler?: string;
}
