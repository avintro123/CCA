import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException)
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    const client: Socket = host.switchToWs().getClient<Socket>();
    const error = exception.getError();
    const message = typeof error === 'string' ? error : (error as any).message;

    client.emit('error', { message });
  }
}
