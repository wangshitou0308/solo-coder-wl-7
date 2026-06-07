import { io, Socket } from 'socket.io-client';
import type { 
  Room, GameState, IdentificationResult, Bid, 
  Relic, ChatMessage 
} from './types';

interface ServerToClientEvents {
  roomCreated: (room: Room) => void;
  roomJoined: (room: Room) => void;
  roomUpdated: (room: Room) => void;
  playerJoined: (player: any) => void;
  playerLeft: (playerId: string) => void;
  gameStarted: (gameState: GameState) => void;
  gameStateUpdated: (gameState: GameState) => void;
  identificationUsed: (result: IdentificationResult) => void;
  bidPlaced: (bid: Bid) => void;
  playerPassed: (playerId: string) => void;
  roundEnded: (data: { winnerId: string; relic: Relic; moneyChange: number }) => void;
  error: (message: string) => void;
  chatMessage: (data: ChatMessage) => void;
}

interface ClientToServerEvents {
  createRoom: (data: { name: string; playerName: string }) => void;
  joinRoom: (data: { roomId: string; playerName: string }) => void;
  leaveRoom: () => void;
  startGame: () => void;
  useIdentificationTool: (data: { tool: string }) => void;
  endIdentification: () => void;
  placeBid: (data: { amount: number }) => void;
  passBid: () => void;
  nextRound: () => void;
  chatMessage: (data: { message: string }) => void;
}

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  autoConnect: false,
});

export default socket;
