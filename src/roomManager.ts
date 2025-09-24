import {GameStatus, Player, Room} from './types';
import {Logger} from './logger';

export class RoomManager {
  private rooms = new Map<string, Room>();

  //TODO: refactor this whole class. Currently the roomManager is mixed up with gaming logic
  createRoom(roomId: string): Room {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId)!;
    }

    const room: Room = {
      id: roomId,
      players: new Map(),
      deck: [],
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

    if (room.status === GameStatus.FULL) {
      return { success: false, error: 'Room is full' };
    }

    if (room.status !== GameStatus.WAITING) {
      return { success: false, error: 'Game already in progress' };
    }

    const player: Player = {
      id: playerId,
      nickname,
      secretCard: null,
      remaining: 20,
      isReady: false
    };

    room.players.set(playerId, player);

    if (room.players.size === 2) {
      room.status = GameStatus.FULL;
    }

    return { success: true, room };
  }

  removePlayerFromRoom(playerId: string, roomId: string): { success: boolean } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false };
    }
    room.players.delete(playerId);
    room.status = GameStatus.WAITING;
    if (room.players.size === 0) {
      this.rooms.delete(roomId);
    }
    return { success: true };
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

  setPlayerReady(roomId: string, playerId: string): { success: boolean; room?: Room; allReady?: boolean; player?: Player} {
    const room = this.getRoom(roomId);
    if (!room) {
      return { success: false };
    }

    const player = room.players.get(playerId);
    if (!player) {
      return { success: false };
    }

    player.isReady = true;

    const allReady = Array.from(room.players.values()).every(p => p.isReady);

    if (allReady && room.players.size === 2) {
      this.startGame(room);
      return { success: true, room, allReady: true, player: player };
    }

    return { success: true, room, allReady: false, player: player };
  }

  private startGame(room: Room): void {
    room.status = GameStatus.PLAYING;

    // Generate fresh deck for this game
    room.deck = this.generateDeck();

    // Assign secret cards to all players
    room.players.forEach(player => {
      player.secretCard = this.assignRandomCard(room.deck);
    });
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