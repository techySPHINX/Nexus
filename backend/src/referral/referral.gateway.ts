import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class ReferralGateway {
  @WebSocketServer()
  server: Server;

  emitReferralCreated(payload: unknown) {
    this.server?.emit('referral.created', payload);
  }

  emitReferralUpdated(payload: unknown) {
    this.server?.emit('referral.updated', payload);
  }

  emitReferralDeleted(payload: unknown) {
    this.server?.emit('referral.deleted', payload);
  }

  emitApplicationCreated(payload: unknown) {
    this.server?.emit('application.created', payload);
  }

  emitApplicationUpdated(payload: unknown) {
    this.server?.emit('application.updated', payload);
  }
}
