export type GamePhase = 'lobby' | 'identification' | 'auction' | 'result';

export type PlayerRole = 'normal' | 'forger';

export type IdentificationTool = 'magnifier' | 'carbon14' | 'historical_record';

export interface Player {
  id: string;
  name: string;
  socketId: string;
  money: number;
  role: PlayerRole;
  isCurrentIdentifier: boolean;
  identificationUsesLeft: number;
  bidAmount: number;
  hasPassed: boolean;
}

export interface RelicPart {
  id: string;
  name: string;
  category: 'body' | 'pattern' | 'material' | 'base' | 'inscription';
  era: string;
  style: string;
  color: string;
  compatibleEras: string[];
  compatibleStyles: string[];
}

export interface Relic {
  id: string;
  name: string;
  era: string;
  style: string;
  parts: RelicPart[];
  isGenuine: boolean;
  realValue: number;
  fakeValue: number;
  descriptions: RelicDescription[];
  flaws: string[];
  pixelData: number[][];
}

export interface RelicDescription {
  text: string;
  isTrue: boolean;
  isVague: boolean;
}

export interface IdentificationResult {
  tool: IdentificationTool;
  clue: string;
  isReliable: boolean;
}

export interface Bid {
  playerId: string;
  amount: number;
  timestamp: number;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  players: Player[];
  currentRelic: Relic | null;
  currentIdentifierIndex: number;
  bids: Bid[];
  currentBid: number;
  minBidIncrement: number;
  identificationResults: IdentificationResult[];
  roundNumber: number;
  winnerId: string | null;
  forgerId: string | null;
  auctionTimer: number;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  players: Player[];
  gameState: GameState | null;
  maxPlayers: number;
  isPlaying: boolean;
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
}
