export interface Player {
  id: string;
  nickname: string;
  secretCard: string;
  remaining: number;
}

export interface Room {
  id: string;
  players: Map<string, Player>;
  deck: string[];
  status: GameStatus;
  createdAt: Date;
}

export interface GameEvents {
  join_room: { roomId: string; nickname: string };
  update_remaining: { remaining: number };
  guess: { cardId: string };
  voice: any;
}

export interface GameResponses {
  init_state: {
    roomId: string;
    deck: string[];
    mySecret: string;
    opponentRemaining: number;
  };
  update_remaining: {
    from: string;
    remaining: number;
  };
  result: {
    winner: string;
    correctCard: string;
    guesser: string;
    guessedCard: string;
  };
  voice: {
    from: string;
    data: any;
  };
  error: {
    message: string;
  };
}

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SUCCESS = 'success',
  DEBUG = 'debug'
}

export enum GameStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished'
}