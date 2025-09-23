import { Socket, Server } from 'socket.io';
import { GameManager } from './gameManager';
import { GameEvents } from './types';
import { Logger } from './logger';

export class SocketHandler {
  constructor(
    private io: Server,
    private gameManager: GameManager
  ) {}

  handleConnection(socket: Socket): void {
    Logger.player(socket.id, 'connected');

    socket.on('join_room', (data: GameEvents['join_room']) => {
      this.handleJoinRoom(socket, data);
    });

    socket.on('update_remaining', (data: GameEvents['update_remaining']) => {
      this.handleUpdateRemaining(socket, data);
    });

    socket.on('guess', (data: GameEvents['guess']) => {
      this.handleGuess(socket, data);
    });

    socket.on('voice', (data: GameEvents['voice']) => {
      this.handleVoice(socket, data);
    });

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private handleJoinRoom(socket: Socket, { roomId, nickname }: GameEvents['join_room']): void {
    Logger.player(socket.id, `joining room ${roomId}`, { nickname });

    const result = this.gameManager.joinGame(socket.id, roomId, nickname);

    if (!result.success) {
      Logger.error(`Failed to join room: ${result.error}`, 'ROOM');
      socket.emit('error', { message: result.error });
      return;
    }

    socket.join(roomId);

    // Send initial state to the joining player
    socket.emit('init_state', result.initData);

    // If game is ready (2 players), send init state to both players
    if (this.gameManager.isGameReady(roomId)) {
      Logger.game(`Game started in room ${roomId}`);
      const { room } = this.gameManager.getGameState(socket.id);
      if (room) {
        room.players.forEach((player, playerId) => {
          const { player: currentPlayer, opponent } = this.gameManager.getGameState(playerId);
          if (currentPlayer && opponent) {
            this.io.to(playerId).emit('init_state', {
              roomId,
              deck: room.deck,
              mySecret: currentPlayer.secretCard,
              opponentRemaining: opponent.remaining
            });
          }
        });
      }
    }
  }

  private handleUpdateRemaining(socket: Socket, { remaining }: GameEvents['update_remaining']): void {
    Logger.player(socket.id, `updated remaining cards`, { remaining });
    const result = this.gameManager.updatePlayerRemaining(socket.id, remaining);

    if (result.success && result.broadcastData) {
      const { room } = this.gameManager.getGameState(socket.id);
      if (room) {
        socket.to(room.id).emit('update_remaining', result.broadcastData);
      }
    }
  }

  private handleGuess(socket: Socket, { cardId }: GameEvents['guess']): void {
    Logger.player(socket.id, `made a guess`, { cardId });
    const result = this.gameManager.makeGuess(socket.id, cardId);

    if (result.success && result.result) {
      const { room } = this.gameManager.getGameState(socket.id);
      if (room) {
        Logger.game(`Game ended in room ${room.id}`, result.result);
        this.io.to(room.id).emit('result', result.result);
      }
    }
  }

  private handleVoice(socket: Socket, voiceData: any): void {
    const result = this.gameManager.handleVoiceData(socket.id, voiceData);

    if (result.success && result.broadcastData) {
      const { room } = this.gameManager.getGameState(socket.id);
      if (room) {
        socket.to(room.id).emit('voice', result.broadcastData);
      }
    }
  }

  private handleDisconnect(socket: Socket): void {
    Logger.player(socket.id, 'disconnected');
    // GameManager will handle cleanup through RoomManager
  }
}