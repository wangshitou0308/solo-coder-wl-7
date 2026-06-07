import { v4 as uuidv4 } from 'uuid';
import { 
  Room, Player, GameState, Relic, IdentificationResult, 
  IdentificationTool, Bid, GamePhase 
} from './types';
import { generateRelic } from './relicGenerator';

const INITIAL_MONEY = 10000;
const MAX_IDENTIFICATION_USES = 3;
const MIN_BID_INCREMENT = 100;
const STARTING_BID = 500;

export class GameManager {
  private rooms: Map<string, Room> = new Map();
  private playerToRoom: Map<string, string> = new Map();

  createRoom(hostName: string, hostSocketId: string): Room {
    const roomId = uuidv4().slice(0, 6).toUpperCase();
    const host: Player = this.createPlayer(hostName, hostSocketId);
    
    const room: Room = {
      id: roomId,
      name: `${hostName}的房间`,
      hostId: host.id,
      players: [host],
      gameState: null,
      maxPlayers: 6,
      isPlaying: false,
    };

    this.rooms.set(roomId, room);
    this.playerToRoom.set(host.id, roomId);
    return room;
  }

  joinRoom(roomId: string, playerName: string, socketId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.players.length >= room.maxPlayers) return null;
    if (room.isPlaying) return null;

    const player = this.createPlayer(playerName, socketId);
    room.players.push(player);
    this.playerToRoom.set(player.id, roomId);
    return room;
  }

  leaveRoom(playerId: string): Room | null {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.players = room.players.filter(p => p.id !== playerId);
    this.playerToRoom.delete(playerId);

    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return null;
    }

    if (room.hostId === playerId) {
      room.hostId = room.players[0].id;
    }

    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByPlayerId(playerId: string): Room | undefined {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  startGame(roomId: string): GameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.players.length < 4) return null;

    room.isPlaying = true;
    const gameState = this.initializeGameState(room);
    room.gameState = gameState;
    return gameState;
  }

  useIdentificationTool(
    roomId: string, 
    playerId: string, 
    tool: IdentificationTool
  ): IdentificationResult | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState || !room.gameState.currentRelic) return null;
    if (room.gameState.phase !== 'identification') return null;

    const player = room.gameState.players.find(p => p.id === playerId);
    if (!player || !player.isCurrentIdentifier) return null;
    if (player.identificationUsesLeft <= 0) return null;

    player.identificationUsesLeft--;
    const result = this.generateIdentificationResult(tool, room.gameState.currentRelic);
    room.gameState.identificationResults.push(result);

    return result;
  }

  endIdentification(roomId: string): GameState | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState) return null;
    if (room.gameState.phase !== 'identification') return null;

    room.gameState.phase = 'auction';
    room.gameState.currentBid = STARTING_BID;
    room.gameState.bids = [];
    
    room.gameState.players.forEach(p => {
      p.bidAmount = 0;
      p.hasPassed = false;
    });

    return room.gameState;
  }

  placeBid(roomId: string, playerId: string, amount: number): Bid | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState) return null;
    if (room.gameState.phase !== 'auction') return null;

    const player = room.gameState.players.find(p => p.id === playerId);
    if (!player || player.hasPassed) return null;
    if (amount < room.gameState.currentBid + room.gameState.minBidIncrement) return null;
    if (amount > player.money) return null;

    const bid: Bid = {
      playerId,
      amount,
      timestamp: Date.now(),
    };

    room.gameState.bids.push(bid);
    room.gameState.currentBid = amount;
    player.bidAmount = amount;

    return bid;
  }

  passBid(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState) return false;
    if (room.gameState.phase !== 'auction') return false;

    const player = room.gameState.players.find(p => p.id === playerId);
    if (!player) return false;

    const highestBidder = room.gameState.players
      .filter(p => !p.hasPassed)
      .sort((a, b) => b.bidAmount - a.bidAmount)[0];
    
    if (highestBidder && highestBidder.id === playerId && room.gameState.bids.length > 0) {
      return false;
    }

    player.hasPassed = true;

    const activePlayers = room.gameState.players.filter(p => !p.hasPassed);
    const activeBidders = activePlayers.filter(p => p.bidAmount > 0);
    
    if (activePlayers.length <= 1 || (activeBidders.length === 1 && activePlayers.every(p => p.hasPassed || p.bidAmount > 0))) {
      this.endAuction(room);
    }

    return true;
  }

  nextRound(roomId: string): GameState | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState) return null;
    if (room.gameState.phase !== 'result') return null;

    room.gameState.roundNumber++;
    room.gameState.phase = 'identification';
    room.gameState.currentRelic = generateRelic();
    room.gameState.identificationResults = [];
    room.gameState.bids = [];
    room.gameState.currentBid = STARTING_BID;
    room.gameState.winnerId = null;

    const nextIdentifierIndex = (room.gameState.currentIdentifierIndex + 1) % room.gameState.players.length;
    room.gameState.currentIdentifierIndex = nextIdentifierIndex;

    room.gameState.players.forEach((p, idx) => {
      p.isCurrentIdentifier = idx === nextIdentifierIndex;
      p.identificationUsesLeft = MAX_IDENTIFICATION_USES;
      p.bidAmount = 0;
      p.hasPassed = false;
    });

    this.assignForger(room.gameState);

    return room.gameState;
  }

  updatePlayerSocketId(playerId: string, socketId: string): void {
    for (const room of this.rooms.values()) {
      const player = room.players.find(p => p.id === playerId);
      if (player) {
        player.socketId = socketId;
        if (room.gameState) {
          const gsPlayer = room.gameState.players.find(p => p.id === playerId);
          if (gsPlayer) gsPlayer.socketId = socketId;
        }
        break;
      }
    }
  }

  private createPlayer(name: string, socketId: string): Player {
    return {
      id: uuidv4(),
      name,
      socketId,
      money: INITIAL_MONEY,
      role: 'normal',
      isCurrentIdentifier: false,
      identificationUsesLeft: MAX_IDENTIFICATION_USES,
      bidAmount: 0,
      hasPassed: false,
    };
  }

  private initializeGameState(room: Room): GameState {
    const relic = generateRelic();
    const players = room.players.map((p, idx) => ({
      ...p,
      money: INITIAL_MONEY,
      isCurrentIdentifier: idx === 0,
      identificationUsesLeft: MAX_IDENTIFICATION_USES,
      bidAmount: 0,
      hasPassed: false,
    }));

    const gameState: GameState = {
      id: uuidv4(),
      phase: 'identification',
      players,
      currentRelic: relic,
      currentIdentifierIndex: 0,
      bids: [],
      currentBid: STARTING_BID,
      minBidIncrement: MIN_BID_INCREMENT,
      identificationResults: [],
      roundNumber: 1,
      winnerId: null,
      forgerId: null,
      auctionTimer: 60,
    };

    this.assignForger(gameState);
    return gameState;
  }

  private assignForger(gameState: GameState): void {
    const forgerIndex = Math.floor(Math.random() * gameState.players.length);
    gameState.players.forEach((p, idx) => {
      p.role = idx === forgerIndex ? 'forger' : 'normal';
    });
    gameState.forgerId = gameState.players[forgerIndex].id;
  }

  private generateIdentificationResult(tool: IdentificationTool, relic: Relic): IdentificationResult {
    const clues = {
      magnifier: [
        `观察到器身${relic.parts[0]?.style || '独特'}风格的纹饰细节。`,
        `发现表面有细微的${relic.isGenuine ? '自然老化' : '人工做旧'}痕迹。`,
        `材质纹理${relic.isGenuine ? '自然流畅' : '略显规整'}。`,
        `注意到边缘处理${relic.isGenuine ? '圆润自然' : '较为生硬'}。`,
      ],
      carbon14: [
        `碳十四检测结果显示年代约为${relic.era}时期。`,
        `检测数据存在一定偏差，年代范围跨度较大。`,
        `样本分析结果与${relic.era}时期特征${relic.isGenuine ? '吻合' : '有一定差异'}。`,
      ],
      historical_record: [
        `史料记载中确有类似${relic.name}的文物存在。`,
        `查阅相关文献，关于此物品的记载${relic.isGenuine ? '详实可信' : '较为模糊'}。`,
        `发现同时期同类文物的风格特征${relic.isGenuine ? '高度一致' : '存在出入'}。`,
      ],
    };

    const toolClues = clues[tool];
    const clue = toolClues[Math.floor(Math.random() * toolClues.length)];
    const isReliable = relic.isGenuine || Math.random() < 0.6;

    return {
      tool,
      clue: isReliable ? clue : `检测结果存在不确定性，${clue}`,
      isReliable,
    };
  }

  private endAuction(room: Room): void {
    if (!room.gameState || !room.gameState.currentRelic) return;

    const highestBidder = room.gameState.players
      .filter(p => !p.hasPassed)
      .sort((a, b) => b.bidAmount - a.bidAmount)[0];

    if (highestBidder && highestBidder.bidAmount > 0) {
      const relic = room.gameState.currentRelic;
      const actualValue = relic.isGenuine ? relic.realValue : relic.fakeValue;
      const profit = actualValue - highestBidder.bidAmount;
      
      highestBidder.money += profit;
      room.gameState.winnerId = highestBidder.id;
    }

    room.gameState.phase = 'result';
  }
}

export const gameManager = new GameManager();
