import { LogLevel } from './types';

export class Logger {
  private static colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
  };

  private static icons = {
    [LogLevel.INFO]: 'ℹ️',
    [LogLevel.WARN]: '⚠️',
    [LogLevel.ERROR]: '❌',
    [LogLevel.SUCCESS]: '✅',
    [LogLevel.DEBUG]: '🔍'
  };

  private static getColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.INFO:
        return this.colors.blue;
      case LogLevel.WARN:
        return this.colors.yellow;
      case LogLevel.ERROR:
        return this.colors.red;
      case LogLevel.SUCCESS:
        return this.colors.green;
      case LogLevel.DEBUG:
        return this.colors.gray;
      default:
        return this.colors.white;
    }
  }

  private static formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const color = this.getColor(level);
    const icon = this.icons[level];
    const contextStr = context ? ` [${context}]` : '';

    return `${color}${icon} ${timestamp} ${level.toUpperCase()}${contextStr}: ${message}${this.colors.reset}`;
  }

  static info(message: string, context?: string): void {
    console.log(this.formatMessage(LogLevel.INFO, message, context));
  }

  static warn(message: string, context?: string): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, context));
  }

  static error(message: string, context?: string): void {
    console.error(this.formatMessage(LogLevel.ERROR, message, context));
  }

  static success(message: string, context?: string): void {
    console.log(this.formatMessage(LogLevel.SUCCESS, message, context));
  }

  static debug(message: string, context?: string): void {
    console.log(this.formatMessage(LogLevel.DEBUG, message, context));
  }

  static player(playerId: string, action: string, details?: any): void {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    this.info(`Player ${playerId} ${action}${detailsStr}`, 'PLAYER');
  }

  static room(roomId: string, action: string, details?: any): void {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    this.info(`Room ${roomId} ${action}${detailsStr}`, 'ROOM');
  }

  static game(action: string, details?: any): void {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    this.success(`${action}${detailsStr}`, 'GAME');
  }

  static server(message: string): void {
    this.success(message, 'SERVER');
  }

  static cleanup(message: string): void {
    this.debug(message, 'CLEANUP');
  }
}