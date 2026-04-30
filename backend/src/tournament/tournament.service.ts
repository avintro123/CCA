import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Team } from './schemas/team.schema';
import { Model } from 'mongoose';
import { CreateTeamDto } from './dto/create-team.dto';
import { User, UserRole } from 'src/auth/user.schema';
import { Match } from 'src/match/schemas/match.schema';

@Injectable()
export class TournamentService {
  constructor(
    @InjectModel(Team.name) private teamModel: Model<Team>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Match.name) private matchModel: Model<Match>,
  ) {}

  async createTeam(createTeamDto: CreateTeamDto, captainId: string) {
    const existingTeam = await this.teamModel.findOne({ captainId });

    if (existingTeam) {
      throw new ForbiddenException(
        'You can only register one team per account.',
      );
    }

    const user = await this.userModel.findById(captainId);
    if (!user) throw new ForbiddenException('User not found');

    // Automatically mark the player as captain if their name matches the creating user's name
    const players = createTeamDto.players.map((player) => ({
      ...player,
      isCaptain:
        player.isCaptain ||
        player.name
          .toLowerCase()
          .includes(user.name.toLowerCase().split(' ')[0]),
    }));

    try {
      const newTeam = new this.teamModel({
        name: createTeamDto.name,
        players,
        captainId,
        status: 'PENDING_PAYMENT',
      });

      const savedTeam = await newTeam.save();

      await this.userModel.findByIdAndUpdate(captainId, {
        role: UserRole.CAPTAIN,
      });

      return savedTeam;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Team name already exists');
      }
      throw error;
    }
  }

  async getAllTeams() {
    const teams = await this.teamModel
      .find()
      .populate('captainId', 'name avatar email')
      .exec();

    return teams.map((team) => {
      const teamObj = team.toObject();
      const hasCaptain = teamObj.players.some((p: any) => p.isCaptain);

      if (!hasCaptain && teamObj.captainId) {
        const captainName = (teamObj.captainId as any).name
          .split(' ')[0]
          .toLowerCase();
        teamObj.players = teamObj.players.map((p: any) => ({
          ...p,
          isCaptain: p.name.toLowerCase().includes(captainName),
        }));
      }
      return teamObj;
    });
  }

  async getStandings() {
    const teams = await this.teamModel.find({ status: 'APPROVED' }).lean();
    const completedMatches = await this.matchModel
      .find({ status: 'COMPLETED' })
      .lean();

    const standings = teams.map((team) => ({
      teamId: team._id,
      name: team.name,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
    }));

    completedMatches.forEach((match) => {
      const winnerId = match.winner?.toString();
      const teamA = match.teamA?.toString();
      const teamB = match.teamB?.toString();

      const teamAStat = standings.find((s) => s.teamId.toString() === teamA);
      const teamBStat = standings.find((s) => s.teamId.toString() === teamB);

      if (teamAStat && teamBStat) {
        teamAStat.played++;
        teamBStat.played++;

        if (winnerId === teamA) {
          teamAStat.won++;
          teamBStat.lost++;
          teamAStat.points += 2;
        } else if (winnerId === teamB) {
          teamBStat.won++;
          teamAStat.lost++;
          teamBStat.points += 2;
        }
      }
    });

    return standings.sort((a, b) => b.points - a.points);
  }

  async approvePayment(teamId: string) {
    const team = await this.teamModel.findByIdAndUpdate(
      teamId,
      { status: 'APPROVED' },
      { returnDocument: 'after' },
    );
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    return team;
  }

  async updateTeamRoster(teamId: string, captainId: string, updateData: any) {
    const team = await this.teamModel.findById(teamId);
    if (!team) {
      throw new NotFoundException('Team not found in db');
    }

    if (team.captainId.toString() !== captainId) {
      throw new ForbiddenException('You are not the captain of this team');
    }

    if (updateData.players) {
      team.players = updateData.players;
    }

    if (updateData.name) {
      team.name = updateData.name;
    }

    try {
      return await team.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Team name already exists');
      }
      throw error;
    }
  }
}
