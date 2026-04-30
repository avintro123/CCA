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

  constructor(private readonly matchService: MatchService) {}

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
    } catch (error) {
      console.log(error);
      client.emit('error', error.message);
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
