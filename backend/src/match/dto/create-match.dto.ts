import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMatchDto {
  @IsString()
  @IsNotEmpty()
  teamA: string;

  @IsString()
  @IsNotEmpty()
  teamB: string;

  @IsOptional()
  @IsString()
  tossWinner?: string;

  @IsOptional()
  @IsEnum(['BAT', 'BOWL'])
  tossDecision?: string;
}
