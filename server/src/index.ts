import { Server } from 'socket.io';
import { createServer } from 'http';
import { RoomManager } from './roomManager';
import { GameManager } from './gameManager';
import { SocketHandler } from './socketHandler';
import { Logger } from './logger';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000","*","http://localhost:63342"],
    methods: ["GET", "POST"]
  }
});

// Initialize managers
const roomManager = new RoomManager();
const gameManager = new GameManager(roomManager);
const socketHandler = new SocketHandler(io, gameManager, roomManager);

// Handle connections
io.on('connection', (socket) => {
  socketHandler.handleConnection(socket);
});

// Cleanup interval
setInterval(() => {
  roomManager.cleanup();
}, 60000); // Run cleanup every minute

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  Logger.server(`Game server running on port ${PORT}`);
});