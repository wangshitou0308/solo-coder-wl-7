import { useState, useEffect } from 'react';
import socket from './socket';
import type { Room, GameState, ChatMessage, IdentificationResult, Bid } from './types';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';

function App() {
  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    socket.connect();

    socket.on('roomCreated', (newRoom) => {
      setRoom(newRoom);
      setPlayerId(newRoom.players[0].id);
      setError('');
    });

    socket.on('roomJoined', (newRoom) => {
      setRoom(newRoom);
      setPlayerId(newRoom.players[newRoom.players.length - 1].id);
      setError('');
    });

    socket.on('roomUpdated', (updatedRoom) => {
      setRoom(updatedRoom);
    });

    socket.on('playerJoined', () => {
    });

    socket.on('playerLeft', () => {
    });

    socket.on('gameStarted', (state) => {
      setGameState(state);
      if (room) {
        setRoom({ ...room, isPlaying: true, gameState: state });
      }
    });

    socket.on('gameStateUpdated', (state) => {
      setGameState(state);
    });

    socket.on('identificationUsed', (_result: IdentificationResult) => {
    });

    socket.on('bidPlaced', (_bid: Bid) => {
    });

    socket.on('playerPassed', () => {
    });

    socket.on('roundEnded', () => {
    });

    socket.on('error', (message) => {
      setError(message);
      setTimeout(() => setError(''), 3000);
    });

    socket.on('chatMessage', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCreateRoom = (playerName: string) => {
    socket.emit('createRoom', { name: `${playerName}的房间`, playerName });
  };

  const handleJoinRoom = (roomId: string, playerName: string) => {
    socket.emit('joinRoom', { roomId, playerName });
  };

  const handleLeaveRoom = () => {
    socket.emit('leaveRoom');
    setRoom(null);
    setGameState(null);
    setChatMessages([]);
  };

  const handleStartGame = () => {
    socket.emit('startGame');
  };

  const handleUseTool = (tool: string) => {
    socket.emit('useIdentificationTool', { tool });
  };

  const handleEndIdentification = () => {
    socket.emit('endIdentification');
  };

  const handlePlaceBid = (amount: number) => {
    socket.emit('placeBid', { amount });
  };

  const handlePassBid = () => {
    socket.emit('passBid');
  };

  const handleNextRound = () => {
    socket.emit('nextRound');
  };

  const handleSendMessage = (message: string) => {
    socket.emit('chatMessage', { message });
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🏺 Relic Auction 古董鉴定与拍卖</h1>
        <p>多人在线对抗 · 鉴宝 · 拍卖 · 心理博弈</p>
      </header>

      {error && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          padding: '15px 25px',
          background: '#f44336',
          color: 'white',
          borderRadius: '8px',
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(244, 67, 54, 0.4)',
        }}>
          {error}
        </div>
      )}

      {!room ? (
        <Lobby
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      ) : (
        <GameRoom
          room={room}
          gameState={gameState}
          playerId={playerId}
          chatMessages={chatMessages}
          onLeaveRoom={handleLeaveRoom}
          onStartGame={handleStartGame}
          onUseTool={handleUseTool}
          onEndIdentification={handleEndIdentification}
          onPlaceBid={handlePlaceBid}
          onPassBid={handlePassBid}
          onNextRound={handleNextRound}
          onSendMessage={handleSendMessage}
        />
      )}
    </div>
  );
}

export default App;
