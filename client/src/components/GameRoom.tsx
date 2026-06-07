import { useState } from 'react';
import type { Room, GameState, ChatMessage } from '../types';
import RelicCanvas from './RelicCanvas';

interface GameRoomProps {
  room: Room;
  gameState: GameState | null;
  playerId: string;
  chatMessages: ChatMessage[];
  onLeaveRoom: () => void;
  onStartGame: () => void;
  onUseTool: (tool: string) => void;
  onEndIdentification: () => void;
  onPlaceBid: (amount: number) => void;
  onPassBid: () => void;
  onNextRound: () => void;
  onSendMessage: (message: string) => void;
}

const TOOL_NAMES: Record<string, string> = {
  magnifier: '🔍 放大镜',
  carbon14: '⚛️ 碳十四检测',
  historical_record: '📜 史料查阅',
};

const PHASE_NAMES: Record<string, string> = {
  lobby: '等待开始',
  identification: '🔬 鉴定阶段',
  auction: '💰 拍卖阶段',
  result: '📊 结果公布',
};

export default function GameRoom({
  room,
  gameState,
  playerId,
  chatMessages,
  onLeaveRoom,
  onStartGame,
  onUseTool,
  onEndIdentification,
  onPlaceBid,
  onPassBid,
  onNextRound,
  onSendMessage,
}: GameRoomProps) {
  const [bidAmount, setBidAmount] = useState('');
  const [chatInput, setChatInput] = useState('');

  const currentPlayer = gameState?.players.find(p => p.id === playerId) 
    || room.players.find(p => p.id === playerId);
  const isHost = room.hostId === playerId;
  const isIdentifier = currentPlayer?.isCurrentIdentifier;
  const isForger = currentPlayer?.role === 'forger';

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const handlePlaceBid = () => {
    const amount = parseInt(bidAmount);
    if (isNaN(amount)) return;
    
    if (!gameState) return;
    
    const minNextBid = gameState.currentBid + gameState.minBidIncrement;
    const playerMoney = currentPlayer?.money || 0;
    
    if (amount > playerMoney) {
      alert(`出价金额不能超过你的资产（¥${playerMoney.toLocaleString()}）`);
      return;
    }
    
    if (amount < minNextBid) {
      alert(`最低出价金额为 ¥${minNextBid.toLocaleString()}`);
      return;
    }
    
    onPlaceBid(amount);
    setBidAmount('');
  };

  const renderWaitingRoom = () => (
    <div className="waiting-room">
      <div className="room-info">
        <h2>{room.name}</h2>
        <p>房间号：<span className="room-code">{room.id}</span></p>
        <p style={{ color: '#a0a0a0' }}>
          玩家：{room.players.length} / {room.maxPlayers}
        </p>
      </div>

      <h3>等待其他玩家加入...</h3>
      <div className="players-list">
        {room.players.map(player => (
          <div key={player.id} className={`player-item ${player.id === room.hostId ? 'host' : ''}`}>
            <div style={{ fontWeight: '600', marginBottom: '5px' }}>{player.name}</div>
            {player.id === room.hostId && (
              <div style={{ fontSize: '0.8rem', color: '#ffd700' }}>👑 房主</div>
            )}
          </div>
        ))}
      </div>

      <div className="btn-group">
        {isHost && (
          <button
            className="btn btn-primary"
            onClick={onStartGame}
            disabled={room.players.length < 4}
          >
            开始游戏 ({room.players.length}/6) {room.players.length < 4 && `(还需${4 - room.players.length}人)`}
          </button>
        )}
        <button className="btn btn-secondary" onClick={onLeaveRoom}>
          离开房间
        </button>
      </div>
    </div>
  );

  const renderIdentificationPhase = () => {
    if (!gameState || !gameState.currentRelic) return null;
    const relic = gameState.currentRelic;

    return (
      <>
        <div className="relic-display">
          <div className="relic-canvas-container">
            <RelicCanvas pixelData={relic.pixelData} size={220} />
          </div>
          <div className="relic-info">
            <h3>{relic.name}</h3>
            <p className="relic-era">🏛️ {relic.era} · {relic.style}风格</p>
            <div className="relic-descriptions">
              {relic.descriptions.map((desc, idx) => (
                <div key={idx} className={`desc-item ${desc.isVague ? 'vague' : ''}`}>
                  {desc.isVague && '❓ '}{desc.text}
                </div>
              ))}
            </div>
            {isForger && (
              <div className="flaws-panel">
                <h4>🎭 仿造者视角 - 破绽提示</h4>
                {relic.isGenuine ? (
                  <p style={{ color: '#4caf50' }}>此物品为真品，没有破绽！</p>
                ) : (
                  relic.flaws.map((flaw, idx) => (
                    <div key={idx} className="flaw-item">⚠️ {flaw}</div>
                  ))
                )}
                <p style={{ marginTop: '10px', fontSize: '0.85rem', color: '#9b59b6' }}>
                  {relic.isGenuine ? '💡 你可以放心出价，或诱导他人放弃。' : '💡 想办法诱导他人高价拍下此赝品！'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="tools-panel">
          <h4>🔧 鉴定工具 {isIdentifier && `(剩余 ${currentPlayer?.identificationUsesLeft || 0} 次)`}</h4>
          <div className="tools">
            {Object.entries(TOOL_NAMES).map(([key, name]) => (
              <button
                key={key}
                className="tool-btn"
                onClick={() => onUseTool(key)}
                disabled={!isIdentifier || (currentPlayer?.identificationUsesLeft || 0) <= 0}
              >
                {name}
              </button>
            ))}
          </div>

          {gameState.identificationResults.length > 0 && (
            <div className="identification-results">
              {gameState.identificationResults.map((result, idx) => (
                <div key={idx} className="result-item">
                  <strong>{TOOL_NAMES[result.tool]}:</strong> {result.clue}
                </div>
              ))}
            </div>
          )}

          {isIdentifier && (
            <div className="btn-group">
              <button className="btn btn-primary" onClick={onEndIdentification}>
                结束鉴定，进入拍卖
              </button>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderAuctionPhase = () => {
    if (!gameState || !gameState.currentRelic) return null;
    const relic = gameState.currentRelic;
    const minNextBid = gameState.currentBid + gameState.minBidIncrement;

    return (
      <>
        <div className="relic-display">
          <div className="relic-canvas-container">
            <RelicCanvas pixelData={relic.pixelData} size={200} />
          </div>
          <div className="relic-info">
            <h3>{relic.name}</h3>
            <p className="relic-era">🏛️ {relic.era} · {relic.style}风格</p>
            <div className="relic-descriptions">
              {relic.descriptions.slice(0, 3).map((desc, idx) => (
                <div key={idx} className={`desc-item ${desc.isVague ? 'vague' : ''}`}>
                  {desc.isVague && '❓ '}{desc.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="auction-panel">
          <div className="current-bid">
            💰 当前出价：¥{gameState.currentBid.toLocaleString()}
          </div>

          {!currentPlayer?.hasPassed ? (
            <>
              <div className="bid-input">
                <input
                  type="number"
                  placeholder={`最低 ¥${minNextBid.toLocaleString()}`}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  min={minNextBid}
                  max={currentPlayer?.money || 0}
                />
                <button
                  className="btn btn-primary"
                  onClick={handlePlaceBid}
                  disabled={!bidAmount || parseInt(bidAmount) < minNextBid}
                >
                  出价
                </button>
                <button className="btn btn-secondary" onClick={onPassBid}>
                  跳过
                </button>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#a0a0a0' }}>
                你的资产：¥{(currentPlayer?.money || 0).toLocaleString()}
              </p>
            </>
          ) : (
            <p style={{ textAlign: 'center', color: '#a0a0a0' }}>你已跳过本轮出价</p>
          )}

          {gameState.bids.length > 0 && (
            <div className="bid-history">
              <h4 style={{ marginBottom: '10px', color: '#e94560' }}>出价记录</h4>
              {[...gameState.bids].reverse().slice(0, 5).map((bid, idx) => {
                const bidder = gameState.players.find(p => p.id === bid.playerId);
                return (
                  <div key={idx} className="bid-item">
                    <span>{bidder?.name || '未知玩家'}</span>
                    <span style={{ color: '#ffd700' }}>¥{bid.amount.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  };

  const renderResultPhase = () => {
    if (!gameState || !gameState.currentRelic) return null;
    const relic = gameState.currentRelic;
    const winner = gameState.players.find(p => p.id === gameState.winnerId);
    const actualValue = relic.isGenuine ? relic.realValue : relic.fakeValue;
    const profit = winner ? actualValue - winner.bidAmount : 0;

    return (
      <div className="result-panel">
        <h2>📊 第 {gameState.roundNumber} 轮结果</h2>
        
        <div className={`relic-result ${relic.isGenuine ? 'genuine' : 'fake'}`}>
          <h3 style={{ color: relic.isGenuine ? '#4caf50' : '#f44336' }}>
            {relic.isGenuine ? '✅ 真品' : '❌ 赝品'} - {relic.name}
          </h3>
          <p>实际价值：<span style={{ color: '#ffd700', fontSize: '1.2rem' }}>¥{actualValue.toLocaleString()}</span></p>
          
          {winner && (
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p>🏆 获得者：<strong>{winner.name}</strong></p>
              <p className="result-value">
                成交价：¥{winner.bidAmount.toLocaleString()}
                <span className={profit >= 0 ? 'profit' : 'loss'} style={{ marginLeft: '15px' }}>
                  {profit >= 0 ? '+' : ''}¥{profit.toLocaleString()}
                </span>
              </p>
            </div>
          )}

          {!relic.isGenuine && relic.flaws.length > 0 && (
            <div className="flaws-list" style={{ marginTop: '20px' }}>
              <h4>🔍 破绽揭示</h4>
              {relic.flaws.map((flaw, idx) => (
                <div key={idx} className="flaw-item">{flaw}</div>
              ))}
            </div>
          )}
        </div>

        {isHost && (
          <button className="btn btn-primary" onClick={onNextRound}>
            开始下一轮
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="room">
      <div className="player-panel">
        <h3>👥 玩家列表</h3>
        {(gameState?.players || room.players).map(player => (
          <div
            key={player.id}
            className={`player-card ${player.isCurrentIdentifier ? 'identifier' : ''} ${player.role === 'forger' && player.id === playerId ? 'forger' : ''}`}
          >
            <div className="player-name">
              {player.name}
              {player.id === room.hostId && <span> 👑</span>}
              {player.isCurrentIdentifier && (
                <span className="player-badge badge-identifier">鉴定师</span>
              )}
              {player.role === 'forger' && player.id === playerId && (
                <span className="player-badge badge-forger">仿造者</span>
              )}
            </div>
            <div className="player-money">
              💰 ¥{(player.money || 10000).toLocaleString()}
            </div>
            {gameState && player.hasPassed && (
              <div style={{ fontSize: '0.8rem', color: '#ff9800' }}>已跳过</div>
            )}
          </div>
        ))}
      </div>

      <div className="game-area">
        {!gameState ? (
          renderWaitingRoom()
        ) : (
          <>
            <div className="game-phase">
              {PHASE_NAMES[gameState.phase]} · 第 {gameState.roundNumber} 轮
            </div>
            {gameState.phase === 'identification' && renderIdentificationPhase()}
            {gameState.phase === 'auction' && renderAuctionPhase()}
            {gameState.phase === 'result' && renderResultPhase()}
          </>
        )}
      </div>

      <div className="chat-panel">
        <h3>💬 聊天</h3>
        <div className="chat-messages">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className="chat-message">
              <span className="chat-sender">{msg.playerName}:</span>
              {msg.message}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            placeholder="输入消息..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button className="btn btn-primary" onClick={handleSendMessage}>
            发送
          </button>
        </div>
        {gameState && (
          <button
            className="btn btn-secondary"
            style={{ marginTop: '10px', width: '100%' }}
            onClick={onLeaveRoom}
          >
            退出游戏
          </button>
        )}
      </div>
    </div>
  );
}
