import {GameStatus, Player, Room} from './types';
import {Logger} from './logger';

export class RoomManager {
  private rooms = new Map<string, Room>();

  createRoom(roomId: string): Room {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId)!;
    }

    const room: Room = {
      id: roomId,
      players: new Map(),
      deck: this.generateDeck(),
      status: GameStatus.WAITING,
      createdAt: new Date()
    };

    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  addPlayerToRoom(roomId: string, playerId: string, nickname: string): { success: boolean; error?: string; room?: Room } {
    const room = this.getRoom(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.players.size >= 2) {
      return { success: false, error: 'Room is full' };
    }

    if (room.status !== 'waiting') {
      return { success: false, error: 'Game already in progress' };
    }

    const secretCard = this.assignRandomCard(room.deck);
    const player: Player = {
      id: playerId,
      nickname,
      secretCard,
      remaining: 20
    };

    room.players.set(playerId, player);

    if (room.players.size === 2) {
      room.status = GameStatus.PLAYING;
    }

    return { success: true, room };
  }

  removePlayerFromRoom(playerId: string): void {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.players.has(playerId)) {
        room.players.delete(playerId);

        if (room.players.size === 0) {
          this.rooms.delete(roomId);
        }
        break;
      }
    }
  }

  findRoomByPlayerId(playerId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.has(playerId)) {
        return room;
      }
    }
    return undefined;
  }

  private generateDeck(): string[] {
    return Array.from({ length: 20 }, (_, i) => `card_${i + 1}`);
  }

  private assignRandomCard(deck: string[]): string {
    return deck[Math.floor(Math.random() * deck.length)];
  }

  // Cleanup old empty rooms
  cleanup(): void {
    const now = new Date();
    for (const [roomId, room] of this.rooms.entries()) {
      const age = now.getTime() - room.createdAt.getTime();
      if (room.players.size === 0 && age > 60000) { // 1 minute
        this.rooms.delete(roomId);
      }
    }
    Logger.cleanup(`Cleanup completed: ${this.rooms.size} active rooms`);
    if (this.rooms.size > 0) {
      Logger.cleanup(`Active rooms: ${Array.from(this.rooms.keys()).join(', ')}`);
    }
  }
}