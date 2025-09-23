import {GameResponses, GameStatus, Player, Room, SocketEvent} from './types';
import {RoomManager} from './roomManager';

export class GameManager {
  constructor(private roomManager: RoomManager) {}

  joinGame(playerId: string, roomId: string, nickname: string): { success: boolean; error?: string } {
    let room = this.roomManager.getRoom(roomId);

    if (!room) {
      room = this.roomManager.createRoom(roomId);
    }

    const result = this.roomManager.addPlayerToRoom(roomId, playerId, nickname);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Don't send init_state here since game hasn't started yet
    // Just return success, init_state will be sent when game starts
    return { success: true };
  }

  setPlayerReady(roomId: string, playerId: string): { success: boolean; allReady?: boolean; room?: Room, player?: Player } {
    return this.roomManager.setPlayerReady(roomId, playerId);
  }

  updatePlayerRemaining(roomId: string, playerId: string, remaining: number): { success: boolean; broadcastData?: GameResponses['update_remaining'] } {
    const room = this.roomManager.getRoom(roomId);
    if (!room) {
      return { success: false };
    }

    const player = room.players.get(playerId);
    if (!player) {
      return { success: false };
    }

    player.remaining = remaining;

    const broadcastData: GameResponses[SocketEvent.UPDATE_REMAINING] = {
      from: player.nickname,
      remaining
    };

    return { success: true, broadcastData };
  }

  makeGuess(roomId: string, playerId: string, cardId: string): { success: boolean; result?: GameResponses[SocketEvent.RESULT] } {
    const room = this.roomManager.getRoom(roomId);
    if (!room || room.status !== GameStatus.PLAYING) {
      return { success: false };
    }

    const guessingPlayer = room.players.get(playerId);
    const otherPlayer = Array.from(room.players.values()).find(p => p.id !== playerId);

    if (!guessingPlayer || !otherPlayer) {
      return { success: false };
    }

    const isCorrect = cardId === otherPlayer.secretCard;
    const winner = isCorrect ? guessingPlayer.nickname : otherPlayer.nickname;

    room.status = GameStatus.FINISHED;

    const result: GameResponses[SocketEvent.RESULT] = {
      winner,
      correctCard: otherPlayer.secretCard || '',
      guesser: guessingPlayer.nickname,
      guessedCard: cardId
    };

    return { success: true, result };
  }

  handleVoiceData(roomId: string, playerId: string, voiceData: any): { success: boolean; broadcastData?: GameResponses['voice'] } {
    const room = this.roomManager.getRoom(roomId);
    if (!room) {
      return { success: false };
    }

    const broadcastData: GameResponses['voice'] = {
      from: playerId,
      data: voiceData
    };

    return { success: true, broadcastData };
  }

  getGameState(roomId: string, playerId: string): { room?: Room; player?: Player; opponent?: Player } {
    const room = this.roomManager.getRoom(roomId);
    if (!room) {
      return {};
    }

    const player = room.players.get(playerId);
    const opponent = Array.from(room.players.values()).find(p => p.id !== playerId);

    return { room, player, opponent };
  }

  isGameReady(roomId: string): boolean {
    const room = this.roomManager.getRoom(roomId);
    return room?.players.size === 2 && room.status === GameStatus.PLAYING;
  }

  removePlayerFromRoom(playerId: string, roomId: string): { success: boolean } {
    return this.roomManager.removePlayerFromRoom(playerId, roomId);
  }
}