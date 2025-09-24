import { Socket, Server } from 'socket.io';
import { GameManager } from './gameManager';
import {GameEvents, SocketEvent} from './types';
import { Logger } from './logger';
import {RoomManager} from "./roomManager";

export class SocketHandler {
  constructor(
    private io: Server,
    private gameManager: GameManager,
    private roomManager: RoomManager
  ) {}

  handleConnection(socket: Socket): void {
    Logger.player(socket.id, 'connected');

    socket.on(SocketEvent.JOIN_ROOM, (data: GameEvents[SocketEvent.JOIN_ROOM]) => {
      this.handleJoinRoom(socket, data);
    });

    socket.on(SocketEvent.UPDATE_REMAINING, (data: GameEvents[SocketEvent.UPDATE_REMAINING]) => {
      this.handleUpdateRemaining(socket, data);
    });

    socket.on(SocketEvent.GUESS, (data: GameEvents[SocketEvent.GUESS]) => {
      this.handleGuess(socket, data);
    });

    socket.on(SocketEvent.VOICE, (data: GameEvents[SocketEvent.VOICE]) => {
      this.handleVoice(socket, data);
    });

    socket.on(SocketEvent.READY, (data: GameEvents[SocketEvent.READY]) => {
      this.handleReady(socket, data);
    })
    socket.on(SocketEvent.DISCONNECT, () => {
      this.handleDisconnect(socket);
    });
  }

  private handleJoinRoom(socket: Socket, { roomId, nickname }: GameEvents[SocketEvent.JOIN_ROOM]): void {
    Logger.player(socket.id, `joining room ${roomId}`, { nickname });

    const result = this.gameManager.joinGame(socket.id, roomId, nickname);

    if (!result.success) {
      Logger.error(`Failed to join room: ${result.error}`, 'ROOM');
      socket.emit('error', { message: result.error });
      return;
    }

    socket.join(roomId);

    // Notify other players that someone joined
    socket.to(roomId).emit(SocketEvent.PLAYER_JOINED, {
      nickname,
      id: socket.id
    });

    // Broadcast the room info
    this.broadcastRoomInfo(roomId);

    // Game will start when both players are ready, not immediately when room is full
  }

  private handleUpdateRemaining(socket: Socket, { roomId, remaining }: GameEvents[SocketEvent.UPDATE_REMAINING]): void {
    Logger.player(socket.id, `updated remaining cards`, { remaining });
    const result = this.gameManager.updatePlayerRemaining(roomId, socket.id, remaining);

    if (result.success && result.broadcastData) {
      socket.to(roomId).emit(SocketEvent.UPDATE_REMAINING, result.broadcastData);
    }
  }

  private handleGuess(socket: Socket, { roomId, cardId }: GameEvents[SocketEvent.GUESS]): void {
    Logger.player(socket.id, `made a guess`, { cardId });
    const result = this.gameManager.makeGuess(roomId, socket.id, cardId);

    if (result.success && result.result) {
      Logger.game(`Game ended in room ${roomId}`, result.result);
      this.io.to(roomId).emit(SocketEvent.RESULT, result.result);
    }
  }

  private handleVoice(socket: Socket, { roomId, data }: GameEvents[SocketEvent.VOICE]): void {
    const result = this.gameManager.handleVoiceData(roomId, socket.id, data);

    if (result.success && result.broadcastData) {
      socket.to(roomId).emit(SocketEvent.VOICE, result.broadcastData);
    }
  }

  private handleReady(socket: Socket, { roomId }: GameEvents[SocketEvent.READY]): void {
    Logger.player(socket.id, `marked ready in room ${roomId}`);

    const result = this.gameManager.setPlayerReady(roomId, socket.id);

    if (!result.success) {
      socket.emit(SocketEvent.ERROR, { message: 'Failed to set ready status' });
      return;
    }

    // Notify other players that this player is ready
    socket.to(roomId).emit(SocketEvent.PLAYER_READY, {
      nickname: result.player!.nickname,
      id: socket.id
    });

    // If all players are ready, start the game
    if (result.allReady && result.room) {
      Logger.game(`All players ready, starting game in room ${roomId}`);

      // Send game started event with cards to all players
      result.room.players.forEach((player, playerId) => {
        this.io.to(playerId).emit(SocketEvent.GAME_STARTED, {
          roomId,
          deck: result.room!.deck,
          mySecret: player.secretCard
        });
      });
    }
  }

  private handleDisconnect(socket: Socket): void {
    Logger.player(socket.id, 'disconnected');

    // Find and remove player from their room
    // Since we don't have roomId in disconnect, we need to search for the player
    const room = this.roomManager.findRoomByPlayerId(socket.id);
    if (room) {
      const player = room.players.get(socket.id);
      const nickname = player?.nickname || 'Unknown';

      Logger.player(socket.id, `leaving room ${room.id}`);

      // Notify other players in the room about disconnection BEFORE removing
      socket.to(room.id).emit(SocketEvent.PLAYER_DISCONNECTED, {
        id: socket.id,
        nickname
      });

      // Remove player from room
      this.roomManager.removePlayerFromRoom(socket.id, room.id);
    }
  }

  private broadcastRoomInfo(roomId: string): void {
    const result = this.gameManager.getGameState(roomId);
    if (!result || !result.players || result.players.length === 0) {
      Logger.warn(`No room data or players found for room ${roomId}`);
      return;
    }

    Logger.debug(`Broadcasting room info to ${result.players.length} players: ${JSON.stringify(result.players.map(p => p.nickname))}`);
    for (const player of result.players) {
      this.io.to(player.id).emit(SocketEvent.ROOM_INFO, result);
    }
  }
}