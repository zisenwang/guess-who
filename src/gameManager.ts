import {GameResponses, GameStatus, Player, Room} from './types';
import {RoomManager} from './roomManager';

export class GameManager {
  constructor(private roomManager: RoomManager) {}

  joinGame(playerId: string, roomId: string, nickname: string): { success: boolean; error?: string; initData?: GameResponses['init_state'] } {
    let room = this.roomManager.getRoom(roomId);

    if (!room) {
      room = this.roomManager.createRoom(roomId);
    }

    const result = this.roomManager.addPlayerToRoom(roomId, playerId, nickname);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const player = room.players.get(playerId)!;
    const otherPlayer = Array.from(room.players.values()).find(p => p.id !== playerId);

    const initData: GameResponses['init_state'] = {
      roomId,
      deck: room.deck,
      mySecret: player.secretCard,
      opponentRemaining: otherPlayer?.remaining || 20
    };

    return { success: true, initData };
  }

  updatePlayerRemaining(playerId: string, remaining: number): { success: boolean; broadcastData?: GameResponses['update_remaining'] } {
    const room = this.roomManager.findRoomByPlayerId(playerId);
    if (!room) {
      return { success: false };
    }

    const player = room.players.get(playerId);
    if (!player) {
      return { success: false };
    }

    player.remaining = remaining;

    const broadcastData: GameResponses['update_remaining'] = {
      from: player.nickname,
      remaining
    };

    return { success: true, broadcastData };
  }

  makeGuess(playerId: string, cardId: string): { success: boolean; result?: GameResponses['result'] } {
    const room = this.roomManager.findRoomByPlayerId(playerId);
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

    const result: GameResponses['result'] = {
      winner,
      correctCard: otherPlayer.secretCard,
      guesser: guessingPlayer.nickname,
      guessedCard: cardId
    };

    return { success: true, result };
  }

  handleVoiceData(playerId: string, voiceData: any): { success: boolean; broadcastData?: GameResponses['voice'] } {
    const room = this.roomManager.findRoomByPlayerId(playerId);
    if (!room) {
      return { success: false };
    }

    const broadcastData: GameResponses['voice'] = {
      from: playerId,
      data: voiceData
    };

    return { success: true, broadcastData };
  }

  getGameState(playerId: string): { room?: Room; player?: Player; opponent?: Player } {
    const room = this.roomManager.findRoomByPlayerId(playerId);
    if (!room) {
      return {};
    }

    const player = room.players.get(playerId);
    const opponent = Array.from(room.players.values()).find(p => p.id !== playerId);

    return { room, player, opponent };
  }

  isGameReady(roomId: string): boolean {
    const room = this.roomManager.getRoom(roomId);
    return room?.players.size === 2 && room.status === 'playing';
  }
}