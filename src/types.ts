export interface Player {
  id: string;
  nickname: string;
  secretCard: string | null;  // null until game starts
  remaining: number;
  isReady: boolean;
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
  update_remaining: { roomId: string; remaining: number };
  ready: { roomId: string };
  guess: { roomId: string; cardId: string };
  voice: { roomId: string; data: any };
}

export interface GameResponses {
  init_state: {
    roomId: string;
    deck: string[];
    mySecret: string;
    opponentRemaining: number;
  };
  player_joined: {
    nickname: string;
    id: string;
  };
  player_ready: {
    nickname: string;
    id: string;
  };
  player_disconnected: {
    nickname: string;
    id: string;
  };
  game_started: {
    roomId: string;
    deck: string[];
    mySecret: string;
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
  room_info: {
    roomId: string;
    players: Map<string, Player>;
    status: GameStatus;
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
  FULL = 'full',
  PLAYING = 'playing',
  FINISHED = 'finished'
}

export enum SocketEvent {
  JOIN_ROOM = 'join_room',
  READY = 'ready',
  UPDATE_REMAINING = 'update_remaining',
  GUESS = 'guess',
  VOICE = 'voice',
  DISCONNECT = 'disconnect',
  INIT_STATE = 'init_state',
  PLAYER_JOINED = 'player_joined',
  PLAYER_READY = 'player_ready',
  PLAYER_DISCONNECTED = 'player_disconnected',
  GAME_STARTED = 'game_started',
  RESULT = 'result',
  ERROR = 'error',
  ROOM_INFO = 'room_info'
}