import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

interface AuthPayload {
  sub: string; // userId
  email: string;
  role: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly userSocketMap = new Map<string, string>(); // userId -> socketId
  private readonly socketUserMap = new Map<string, string>(); // socketId -> userId

  constructor(private readonly configService: ConfigService) {}

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.replace('Bearer ', '');
      if (!token) {
        this.logger.warn('Socket connection rejected: No token provided');
        socket.disconnect();
        return;
      }
      const secret = this.configService.get('JWT_SECRET') || 'your-secret-key';
      const payload = jwt.verify(token, secret) as AuthPayload;
      const userId = payload.sub;
      this.userSocketMap.set(userId, socket.id);
      this.socketUserMap.set(socket.id, userId);
      this.logger.log(`User ${userId} connected with socket ${socket.id}`);
    } catch (err) {
      this.logger.warn('Socket connection rejected: Invalid token');
      socket.disconnect();
    }
  }

  async handleDisconnect(socket: Socket) {
    const userId = this.socketUserMap.get(socket.id);
    if (userId) {
      this.userSocketMap.delete(userId);
      this.socketUserMap.delete(socket.id);
      this.logger.log(`User ${userId} disconnected from socket ${socket.id}`);
    }
  }

  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      this.logger.log(`Emitted event '${event}' to user ${userId}`);
    } else {
      this.logger.warn(`No active socket for user ${userId}`);
    }
  }
} 