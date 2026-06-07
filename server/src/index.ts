import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { ClientToServerEvents, ServerToClientEvents } from './types';
import { gameManager } from './gameManager';

const app = express();
const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/rooms', (_req, res) => {
  const rooms = Array.from(gameManager['rooms'].values()).map(r => ({
    id: r.id,
    name: r.name,
    playerCount: r.players.length,
    maxPlayers: r.maxPlayers,
    isPlaying: r.isPlaying,
  }));
  res.json(rooms);
});

const playerSocketMap = new Map<string, string>();

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('createRoom', ({ name, playerName }) => {
    try {
      const room = gameManager.createRoom(playerName, socket.id);
      playerSocketMap.set(room.players[0].id, socket.id);
      socket.join(room.id);
      socket.emit('roomCreated', room);
      io.to(room.id).emit('roomUpdated', room);
    } catch (error) {
      socket.emit('error', '创建房间失败');
    }
  });

  socket.on('joinRoom', ({ roomId, playerName }) => {
    try {
      const room = gameManager.joinRoom(roomId.toUpperCase(), playerName, socket.id);
      if (!room) {
        socket.emit('error', '加入房间失败：房间不存在或已满');
        return;
      }
      const newPlayer = room.players[room.players.length - 1];
      playerSocketMap.set(newPlayer.id, socket.id);
      socket.join(room.id);
      socket.emit('roomJoined', room);
      io.to(room.id).emit('playerJoined', newPlayer);
      io.to(room.id).emit('roomUpdated', room);
    } catch (error) {
      socket.emit('error', '加入房间失败');
    }
  });

  socket.on('leaveRoom', () => {
    const playerId = getPlayerIdBySocketId(socket.id);
    if (!playerId) return;

    const room = gameManager.leaveRoom(playerId);
    playerSocketMap.delete(playerId);

    if (room) {
      io.to(room.id).emit('playerLeft', playerId);
      io.to(room.id).emit('roomUpdated', room);
    }
  });

  socket.on('startGame', () => {
    const playerId = getPlayerIdBySocketId(socket.id);
    if (!playerId) return;

    const room = gameManager.getRoomByPlayerId(playerId);
    if (!room || room.hostId !== playerId) {
      socket.emit('error', '只有房主可以开始游戏');
      return;
    }

    const gameState = gameManager.startGame(room.id);
    if (!gameState) {
      socket.emit('error', '开始游戏失败，至少需要4名玩家');
      return;
    }

    gameState.players.forEach(p => {
      const playerSocketId = playerSocketMap.get(p.id);
      if (playerSocketId) {
        const personalState = {
          ...gameState,
          players: gameState.players.map(pp => ({
            ...pp,
            role: pp.id === p.id ? pp.role : 'normal',
          })),
          forgerId: p.role === 'forger' ? gameState.forgerId : null,
        };
        io.to(playerSocketId).emit('gameStarted', personalState as any);
      }
    });
  });

  socket.on('useIdentificationTool', ({ tool }) => {
    const playerId = getPlayerIdBySocketId(socket.id);
    if (!playerId) return;

    const room = gameManager.getRoomByPlayerId(playerId);
    if (!room || !room.gameState) return;

    const result = gameManager.useIdentificationTool(room.id, playerId, tool);
    if (result) {
      io.to(room.id).emit('identificationUsed', result);
      io.to(room.id).emit('gameStateUpdated', room.gameState);
    }
  });

  socket.on('endIdentification', () => {
    const playerId = getPlayerIdBySocketId(socket.id);
    if (!playerId) return;

    const room = gameManager.getRoomByPlayerId(playerId);
    if (!room || !room.gameState) return;

    const player = room.gameState.players.find(p => p.id === playerId);
    if (!player?.isCurrentIdentifier) {
      socket.emit('error', '只有当前鉴定师可以结束鉴定阶段');
      return;
    }

    const gameState = gameManager.endIdentification(room.id);
    if (gameState) {
      io.to(room.id).emit('gameStateUpdated', gameState);
    }
  });

  socket.on('placeBid', ({ amount }) => {
    const playerId = getPlayerIdBySocketId(socket.id);
    if (!playerId) return;

    const room = gameManager.getRoomByPlayerId(playerId);
    if (!room || !room.gameState) return;

    const player = room.gameState.players.find(p => p.id === playerId);
    
    if (player && amount > player.money) {
      socket.emit('error', '出价金额不能超过你的资产！');
      return;
    }

    const bid = gameManager.placeBid(room.id, playerId, amount);
    if (bid) {
      io.to(room.id).emit('bidPlaced', bid);
      io.to(room.id).emit('gameStateUpdated', room.gameState);
    } else {
      socket.emit('error', '出价失败，请检查金额是否符合要求');
    }
  });

  socket.on('passBid', () => {
    const playerId = getPlayerIdBySocketId(socket.id);
    if (!playerId) return;

    const room = gameManager.getRoomByPlayerId(playerId);
    if (!room || !room.gameState) return;

    const success = gameManager.passBid(room.id, playerId);
    if (success) {
      io.to(room.id).emit('playerPassed', playerId);
      
      if (room.gameState.phase === 'result') {
        const winner = room.gameState.players.find(p => p.id === room.gameState?.winnerId);
        if (winner && room.gameState.currentRelic) {
          const actualValue = room.gameState.currentRelic.isGenuine 
            ? room.gameState.currentRelic.realValue 
            : room.gameState.currentRelic.fakeValue;
          const moneyChange = actualValue - winner.bidAmount;
          
          io.to(room.id).emit('roundEnded', {
            winnerId: room.gameState.winnerId,
            relic: room.gameState.currentRelic,
            moneyChange,
          });
        }
      }
      
      io.to(room.id).emit('gameStateUpdated', room.gameState);
    } else {
      socket.emit('error', '作为当前最高出价者，你不能跳过！');
    }
  });

  socket.on('nextRound', () => {
    const playerId = getPlayerIdBySocketId(socket.id);
    if (!playerId) return;

    const room = gameManager.getRoomByPlayerId(playerId);
    if (!room || !room.gameState || room.hostId !== playerId) {
      socket.emit('error', '只有房主可以开始下一轮');
      return;
    }

    const gameState = gameManager.nextRound(room.id);
    if (gameState) {
      gameState.players.forEach(p => {
        const playerSocketId = playerSocketMap.get(p.id);
        if (playerSocketId) {
          const personalState = {
            ...gameState,
            players: gameState.players.map(pp => ({
              ...pp,
              role: pp.id === p.id ? pp.role : 'normal',
            })),
            forgerId: p.role === 'forger' ? gameState.forgerId : null,
          };
          io.to(playerSocketId).emit('gameStateUpdated', personalState as any);
        }
      });
    }
  });

  socket.on('chatMessage', ({ message }) => {
    const playerId = getPlayerIdBySocketId(socket.id);
    if (!playerId) return;

    const room = gameManager.getRoomByPlayerId(playerId);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    io.to(room.id).emit('chatMessage', {
      playerId,
      playerName: player.name,
      message,
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const playerId = getPlayerIdBySocketId(socket.id);
    if (playerId) {
      const room = gameManager.leaveRoom(playerId);
      playerSocketMap.delete(playerId);
      if (room) {
        io.to(room.id).emit('playerLeft', playerId);
        io.to(room.id).emit('roomUpdated', room);
      }
    }
  });
});

function getPlayerIdBySocketId(socketId: string): string | null {
  for (const [playerId, sId] of playerSocketMap.entries()) {
    if (sId === socketId) return playerId;
  }
  return null;
}

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});
