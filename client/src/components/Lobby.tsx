import { useState } from 'react';

interface LobbyProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
}

export default function Lobby({ onCreateRoom, onJoinRoom }: LobbyProps) {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  const handleCreate = () => {
    if (!playerName.trim()) return;
    onCreateRoom(playerName.trim());
  };

  const handleJoin = () => {
    if (!playerName.trim() || !roomId.trim()) return;
    onJoinRoom(roomId.trim(), playerName.trim());
  };

  return (
    <div className="lobby">
      <div className="lobby-form">
        <div style={{ display: 'flex', marginBottom: '20px' }}>
          <button
            className={`btn ${activeTab === 'create' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, borderRadius: '8px 0 0 8px' }}
            onClick={() => setActiveTab('create')}
          >
            创建房间
          </button>
          <button
            className={`btn ${activeTab === 'join' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, borderRadius: '0 8px 8px 0' }}
            onClick={() => setActiveTab('join')}
          >
            加入房间
          </button>
        </div>

        <div className="form-group">
          <label>你的昵称</label>
          <input
            type="text"
            placeholder="请输入你的昵称"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                activeTab === 'create' ? handleCreate() : handleJoin();
              }
            }}
          />
        </div>

        {activeTab === 'join' && (
          <div className="form-group">
            <label>房间号</label>
            <input
              type="text"
              placeholder="请输入6位房间号"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              maxLength={6}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoin();
              }}
            />
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '10px' }}
          onClick={activeTab === 'create' ? handleCreate : handleJoin}
          disabled={!playerName.trim() || (activeTab === 'join' && !roomId.trim())}
        >
          {activeTab === 'create' ? '创建房间' : '加入房间'}
        </button>
      </div>

      <div style={{
        textAlign: 'center',
        maxWidth: '600px',
        color: '#a0a0a0',
        lineHeight: '1.8',
      }}>
        <h3 style={{ color: '#e94560', marginBottom: '15px' }}>🎮 游戏规则</h3>
        <p>每局游戏4-6名玩家在线对抗，轮流扮演鉴定师角色。</p>
        <p>使用放大镜、碳十四检测、史料查阅等工具获取线索。</p>
        <p>鉴定阶段结束后进入拍卖，古董有50%概率为真品或赝品。</p>
        <p>以合理价格拍得真品，或诱导他人高价拍得赝品。</p>
        <p style={{ marginTop: '10px', color: '#9b59b6' }}>
          🎭 每局随机分配一名"仿造者"，知道古董真伪，目标是误导他人！
        </p>
      </div>
    </div>
  );
}
