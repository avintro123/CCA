import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TournamentService } from './tournament.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateTeamDto } from './dto/create-team.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User, UserRole } from 'src/auth/user.schema';

@Controller('tournament')
export class TournamentController {
  constructor(private tournamentService: TournamentService) {}

  @Post('teams')
  @UseGuards(AuthGuard('jwt'))
  async registerTeam(@Req() req, @Body() createTeamDto: CreateTeamDto) {
    const captainId = req.user.userId;
    const team = await this.tournamentService.createTeam(
      createTeamDto,
      captainId,
    );

    return {
      message: 'Team registered! Awaiting payment approval.',
      data: team,
    };
  }

  @Put('teams/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.CAPTAIN)
  async updateRoster(
    @Param('id') teamId: string,
    @Body() updateData: any,
    @Req() req,
  ) {
    const captainId = req.user.userId;
    const updatedTeam = await this.tournamentService.updateTeamRoster(
      teamId,
      captainId,
      updateData,
    );
    return { message: 'Roster updated successfully', data: updatedTeam };
  }

  @Put('teams/:id/approve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async approvePayment(@Param('id') teamId: string) {
    const team = await this.tournamentService.approvePayment(teamId);
    return { message: 'Team officially added to the tournament', data: team };
  }

  @Get('teams')
  async getTeams() {
    const teams = await this.tournamentService.getAllTeams();
    return {
      message: 'Retrived all teams successfully',
      data: teams,
    };
  }

  @Get('teams/:id')
  async getTeam(@Param('id') teamId: string) {
    const team = await this.tournamentService.getTeamById(teamId);
    return {
      message: 'Retrieved team details successfully',
      data: team,
    };
  }

  @Get('standings')
  async getStandings() {
    const table = await this.tournamentService.getStandings();
    return {
      message: 'Retrived standings successfully',
      data: table,
    };
  }
}
