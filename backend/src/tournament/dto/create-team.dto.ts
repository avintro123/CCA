import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

enum PlayerRole {
  BATSMAN = 'BATSMAN',
  BOWLER = 'BOWLER',
  ALL_ROUNDER = 'ALL_ROUNDER',
  WICKET_KEEPER = 'WICKET_KEEPER',
}

class PlayerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(PlayerRole)
  role: PlayerRole;

  @IsBoolean()
  @IsOptional()
  isCaptain: boolean;
}

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerDto)
  players: PlayerDto[];
}
