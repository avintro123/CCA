import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { MatchService } from './match.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateMatchDto } from './dto/create-match.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/user.schema';

@Controller('match')
export class MatchController {
  constructor(private matchService: MatchService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async scheduleMatch(@Body() createMatchDto: CreateMatchDto) {
    const match = await this.matchService.createMatch(createMatchDto);

    if (!match) {
      throw new BadRequestException('Match not scheduled');
    }

    return {
      message: 'Match successfully scheduled!',
      data: match,
    };
  }

  @Get()
  async getSchedule() {
    const matches = await this.matchService.getAllMatches();
    return {
      message: 'Retrieved match schedule successfully',
      data: matches,
    };
  }

  //  Get ball-by-ball log for a match

  @Get(':id/ball-log')
  async getBallLog(@Param('id') matchId: string) {
    const data = await this.matchService.getBallLog(matchId);
    return {
      message: 'Ball log retrieved successfully',
      data,
    };
  }

  @Get(':id')
  async getMatch(@Param('id') matchId: string) {
    const match = await this.matchService.getMatchById(matchId);
    return {
      message: 'Match retrieved successfully',
      data: match,
    };
  }

  @Put(':id/complete')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCORER)
  async completeMatch(
    @Param('id') matchId: string,
    @Body() body: { winnerId: string; resultSummary: string },
  ) {
    const match = await this.matchService.completeMatch(
      matchId,
      body.winnerId,
      body.resultSummary,
    );
    if (!match) {
      throw new BadRequestException('Match not completed');
    }
    return {
      message: 'Match completed successfully',
      data: match,
    };
  }
}
