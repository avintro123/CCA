import {
  ConnectedSocket,
  MessageBody,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { SubscribeMessage } from '@nestjs/websockets';
import {
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchService } from './match.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsJwtGuard } from 'src/auth/guards/ws-jwt.guard';
import { UserRole } from 'src/auth/user.schema';
import { RecordBallDto } from './dto/record-ball.dto';
import { WsExceptionFilter } from './ws-exception.filter';

@UseFilters(new WsExceptionFilter())
@WebSocketGateway({ cors: { origin: '*' } })
export class MatchGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly matchService: MatchService,
    private readonly httpService: HttpService,
  ) {}

  afterInit(server: any) {
    console.log('Gateway Initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinMatch')
  handleJoinRoom(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.matchId);
    console.log(`Client ${client.id} joined match ${data.matchId}`);
  }

  @UseGuards(WsJwtGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @SubscribeMessage('recordBall')
  async handleRecordBall(
    @MessageBody() data: RecordBallDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SCORER) {
      client.emit(  
        'error',
        'You do not have the required permission to perform this action',
      );
      return;
    }

    try {
      const result = await this.matchService.recordBall(data);

      // Broadcast the ball update to everyone watching this match
      this.server.to(data.matchId).emit('ballUpdate', result);

      // emit scoreUpdated for backward compatibility
      this.server.to(data.matchId).emit('scoreUpdated', result.liveScorecard);

      // Call Python AI Service in the background
      this.generateAndBroadcastAiCommentary(data, result);
    } catch (error) {
      console.log(error);
      client.emit('error', error.message);
    }
  }

  private async generateAndBroadcastAiCommentary(data: RecordBallDto, result: any) {
    try {
      const matchContext = {
        score: result.liveScorecard.score,
        wickets: result.liveScorecard.wickets,
        overs: result.liveScorecard.overs,
        ballsInCurrentOver: result.liveScorecard.ballsInCurrentOver,
        currentInnings: result.liveScorecard.currentInnings,
        target: result.currentInnings === 2 && result.innings1 ? result.innings1.score + 1 : null,
        status: result.status,
      };

      const payload = {
        ball_event: {
          batsmanName: data.batsmanName,
          bowlerName: data.bowlerName,
          runs: data.runs,
          extras: data.extras || 0,
          extraType: data.extraType || null,
          isWicket: data.isWicket || false,
          wicketType: data.wicketType || null,
          dismissedPlayer: data.dismissedPlayer || null,
        },
        match_context: matchContext,
      };

      const response = await lastValueFrom(
        this.httpService.post('http://localhost:8000/commentary', payload),
      );

      if (response.data && response.data.commentary) {
        this.server.to(data.matchId).emit('aiCommentary', {
          matchId: data.matchId,
          commentary: response.data.commentary,
          timestamp: new Date(),
        });
      }
    } catch (err) {
      console.error('[NestJS AI Service Error]', err.message);
      // Fallback
      const fallbackMsg = data.isWicket 
        ? `WICKET! ${data.dismissedPlayer || data.batsmanName} is out!` 
        : data.runs === 6 
          ? `SIX! Beautiful shot by ${data.batsmanName}!` 
          : data.runs === 4 
            ? `FOUR! Crucial boundary from ${data.batsmanName}!` 
            : `${data.runs} runs scored by ${data.batsmanName}.`;
      
      this.server.to(data.matchId).emit('aiCommentary', {
        matchId: data.matchId,
        commentary: fallbackMsg,
        timestamp: new Date(),
      });
    }
  }
 
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('updateScore')
  async handleUpdateScore(
    @MessageBody() data: { matchId: string; newScore: any },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SCORER) {
      client.emit(
        'error',
        'You do not have the required permission to perform this action',
      );
      return;
    }

    try {
      const updatedScorecard = await this.matchService.updateLiveScore(
        data.matchId,
        data.newScore,
      );
      this.server.to(data.matchId).emit('scoreUpdated', updatedScorecard);
    } catch (error) {
      console.log(error);
      client.emit('error', error.message);
    }
  }
}
