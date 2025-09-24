import { Server } from 'socket.io';
import { createServer } from 'http';
import { RoomManager } from './roomManager';
import { GameManager } from './gameManager';
import { SocketHandler } from './socketHandler';
import { Logger } from './logger';

const httpServer = createServer();

// CORS configuration for production and development
const corsOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || "https://your-frontend-domain.vercel.app"]
  : ["http://localhost:3000", "http://localhost:63342", "*"];

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"],
    credentials: true
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