'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Image from 'next/image';

type GameStatus = 'waiting' | 'full' | 'playing' | 'finished';

interface Player {
  id: string;
  nickname: string;
  secretCard: string | null;
  remaining: number;
  isReady: boolean;
}

interface GameState {
  status: GameStatus;
  players: Player[];
  deck: string[];
  mySecret: string | null;
  opponentRemaining: number;
  winner: string | null;
  correctCard: string | null;
}

export default function GameRoom() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.id as string;
  const nickname = searchParams.get('nickname') || '';

  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    status: 'waiting',
    players: [],
    deck: [],
    mySecret: null,
    opponentRemaining: 20,
    winner: null,
    correctCard: null
  });
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [isReady, setIsReady] = useState(false);
  const [selectedGuessCard, setSelectedGuessCard] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!nickname) return;

    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('join_room', { roomId, nickname });
    });

    newSocket.on('room_info', (data) => {
      console.log('Room info:', data);
      setGameState(prev => ({
        ...prev,
        players: data.players,
        status: data.status
      }));
    });

    newSocket.on('player_joined', (data) => {
      console.log('Player joined:', data);
    });

    newSocket.on('player_ready', (data) => {
      console.log('Player ready:', data);
    });

    newSocket.on('game_started', (data) => {
      console.log('Game started:', data);
      setGameState(prev => ({
        ...prev,
        status: 'playing',
        deck: data.deck,
        mySecret: data.mySecret
      }));
    });

    newSocket.on('update_remaining', (data) => {
      console.log('Remaining updated:', data);
      setGameState(prev => ({
        ...prev,
        opponentRemaining: data.remaining
      }));
    });

    newSocket.on('result', (data) => {
      console.log('Game result:', data);
      console.log('socket', newSocket.id);
      const id = newSocket.id;
      setGameState(prev => ({
        ...prev,
        status: 'finished',
        winner: data.winner,
        correctCard: data.correctCard.find((card: { player: string; card: string }) => card.player !== id)?.card || null
      }));
    });

    newSocket.on('voice', (data) => {
      console.log('Received voice data:', data);
      playReceivedAudio(data.data);
    });

    newSocket.on('error', (data) => {
      console.error('Socket error:', data);
      alert(data.message);
    });

    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      newSocket.close();
    };
  }, [roomId, nickname]);

  const handleReady = () => {
    if (!socket) return;

    socket.emit('ready', { roomId });
    setIsReady(true);
  };

  const handleCardFlip = (cardId: string) => {
    if (gameState.status !== 'playing') return;

    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(cardId)) {
      newFlipped.delete(cardId);
    } else {
      newFlipped.add(cardId);
    }

    setFlippedCards(newFlipped);

    // Send remaining count to server
    const remaining = gameState.deck.length - newFlipped.size;
    socket?.emit('update_remaining', { roomId, remaining });
  };

  const handleGuess = () => {
    if (!socket || !selectedGuessCard) return;

    const confirmed = confirm(`Are you sure you want to guess "${selectedGuessCard}"?`);
    if (confirmed) {
      socket.emit('guess', { roomId, cardId: selectedGuessCard });
    }
  };

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please allow microphone access for voice chat.');
      return null;
    }
  };

  const startRecording = async () => {
    let stream = audioStream;
    if (!stream) {
      stream = await initializeAudio();
      if (!stream) return;
    }

    const recorder = new MediaRecorder(stream);
    const audioChunks: BlobPart[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        if (socket) {
          socket.emit('voice', { roomId, data: base64Audio });
        }
      };
      reader.readAsDataURL(audioBlob);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const playReceivedAudio = (base64Audio: string) => {
    const audio = new Audio(base64Audio);
    audio.play().catch(error => {
      console.error('Error playing received audio:', error);
    });
  };

  const myRemaining = gameState.deck.length - flippedCards.size;
  const opponentPlayer = gameState.players.find(p => p.nickname !== nickname);

  if (!nickname) {
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Access</h1>
          <p>Please go back to the home page and enter your nickname.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Room: {roomId}</h1>
            <p className="text-gray-600">Welcome, {nickname}!</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Status: <span className="font-semibold capitalize">{gameState.status}</span>
            </p>
            <p className="text-sm text-gray-600">
              Players: {gameState.players.length}/2
            </p>
          </div>
        </div>
      </div>

      {/* Remaining Cards Counter */}
      {gameState.status === 'playing' && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex justify-between text-center">
            <div>
              <p className="text-sm text-gray-600">Your remaining</p>
              <p className="text-2xl font-bold text-blue-600">{myRemaining}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {opponentPlayer?.nickname || 'Opponent'} remaining
              </p>
              <p className="text-2xl font-bold text-purple-600">{gameState.opponentRemaining}</p>
            </div>
          </div>
        </div>
      )}

      {/* Game Status Messages */}
      {gameState.status === 'waiting' && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p className="font-bold">Waiting for another player to join...</p>
        </div>
      )}

      {gameState.status === 'full' && !isReady && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          <p className="font-bold">Room is full! Click Ready when you're prepared to play.</p>
          <button
            onClick={handleReady}
            className="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
          >
            Ready to Play!
          </button>
        </div>
      )}

      {isReady && gameState.status === 'full' && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
          <p className="font-bold">Waiting for both players to be ready...</p>
        </div>
      )}

      {/* Main Game Layout */}
      {gameState.deck.length > 0 && (
        <div className="flex gap-4 h-[calc(100vh-280px)]">
          {/* Left Side - Card Grid (4/5 width) */}
          <div className="flex-[4] bg-white rounded-lg shadow-md p-4 flex flex-col">
            <h2 className="text-lg font-semibold mb-3">Character Cards</h2>
            <div className="grid grid-cols-10 grid-rows-2 gap-2 flex-1 max-h-full">
              {gameState.deck.map((cardId) => (
                <div key={cardId} className="relative min-h-0">
                  <div
                    onClick={() => gameState.status === 'playing' && handleCardFlip(cardId)}
                    className={`
                      w-full h-full rounded-md border-2 cursor-pointer transition-all duration-200 overflow-hidden relative min-h-[60px]
                      ${flippedCards.has(cardId)
                        ? 'border-gray-400 opacity-30'
                        : 'border-blue-300 hover:border-blue-500'
                      }
                      ${gameState.status !== 'playing' ? 'cursor-not-allowed opacity-75' : ''}
                    `}
                  >
                    <Image
                      src={`/characters/${cardId}.png`}
                      alt={cardId}
                      fill
                      className={`${flippedCards.has(cardId) ? 'grayscale' : ''}`}
                      sizes="(max-width: 768px) 20vw, 15vw"
                    />
                    {flippedCards.has(cardId) && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">❌</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Controls (1/5 width) */}
          <div className="flex-[1] space-y-4">
            {/* Secret Card Display */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-sm font-semibold mb-2 text-gray-700">Your Secret Card</h3>
              <div className="aspect-square border-2 border-green-400 rounded-lg overflow-hidden relative">
                {gameState.mySecret ? (
                  <Image
                    src={`/characters/${gameState.mySecret}.png`}
                    alt={gameState.mySecret}
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                ) : (
                  <div className="w-full h-full bg-green-100 flex items-center justify-center font-bold text-green-700">
                    Not assigned
                  </div>
                )}
              </div>
            </div>

            {/* Voice Chat */}
            {gameState.status === 'playing' && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Voice Chat</h3>
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  className={`w-full py-3 px-4 rounded-md font-semibold transition-colors ${
                    isRecording
                      ? 'bg-red-500 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isRecording ? '🎤 Recording...' : '🎤 Hold to Talk'}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Hold down to record voice message
                </p>
              </div>
            )}

            {/* Guess Selection */}
            {gameState.status === 'playing' && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Make Your Guess</h3>

                {/* Card Selection for Guess */}
                <div className="mb-4">
                  <select
                    value={selectedGuessCard || ''}
                    onChange={(e) => setSelectedGuessCard(e.target.value || null)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Select a card to guess</option>
                    {gameState.deck
                      .filter(cardId => !flippedCards.has(cardId))
                      .map((cardId) => (
                        <option key={cardId} value={cardId}>
                          {cardId}
                        </option>
                      ))
                    }
                  </select>
                </div>

                {/* Guess Button */}
                <button
                  onClick={handleGuess}
                  disabled={!selectedGuessCard}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-md font-semibold transition-colors"
                >
                  {selectedGuessCard ? `Guess: ${selectedGuessCard}` : 'Select Card First'}
                </button>

                {/* Quick Stats */}
                <div className="mt-4 text-xs text-gray-600">
                  <p>Remaining options: {gameState.deck.length - flippedCards.size}</p>
                  <p>Eliminated: {flippedCards.size}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Result Modal */}
      {gameState.status === 'finished' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 text-center max-w-sm w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">
              {gameState.winner === nickname ? '🎉 You Won!' : '😔 You Lost'}
            </h2>
            <p className="mb-4">
              The correct card was: <strong>{gameState.correctCard}</strong>
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}