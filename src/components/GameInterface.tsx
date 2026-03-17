import { useState, useEffect, useRef } from 'react';
import { User, Message, PvPBattle, Mission } from '../types/game';
import { listenToUser, listenToAllUsers, updateUser } from '../services/userService';
import { listenToMessages } from '../services/chatService';
import { listenToPendingBattles } from '../services/pvpService';
import { parseCommand } from '../game/commandParser';
import { getClassById } from '../data/classes';
import { getRandomMission, MISSIONS } from '../data/missions';
import { Send, Users, Shield, Zap, Trophy, Coins, Target, Trash2 } from 'lucide-react';

export default function GameInterface({ uid }: { uid: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [pendingBattles, setPendingBattles] = useState<PvPBattle[]>([]);
  const [suggestedMission, setSuggestedMission] = useState<Mission | null>(null);
  const [input, setInput] = useState('');
  const [clearedAt, setClearedAt] = useState<number>(0);
  const [missionProgress, setMissionProgress] = useState<number>(0);
  const [isStartingMission, setIsStartingMission] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (user?.activeMission) {
      const updateProgress = () => {
        const now = Date.now();
        const start = new Date(user.activeMission!.startTime).getTime();
        const end = new Date(user.activeMission!.endTime).getTime();
        const total = end - start;
        const elapsed = now - start;
        const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
        setMissionProgress(progress);
      };
      updateProgress();
      interval = setInterval(updateProgress, 1000);
    } else {
      setMissionProgress(0);
    }
    return () => clearInterval(interval);
  }, [user?.activeMission]);

  useEffect(() => {
    if (user) {
      setSuggestedMission(getRandomMission(user.level));
    }
  }, [user?.level, user?.missionsCompleted]);

  useEffect(() => {
    updateUser(uid, { isOnline: true });

    const handleBeforeUnload = () => {
      updateUser(uid, { isOnline: false });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const unsubUser = listenToUser(uid, setUser);
    const unsubMessages = listenToMessages(setMessages);
    const unsubAllUsers = listenToAllUsers(setOnlineUsers);
    const unsubBattles = listenToPendingBattles(uid, setPendingBattles);

    return () => {
      updateUser(uid, { isOnline: false });
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unsubUser();
      unsubMessages();
      unsubAllUsers();
      unsubBattles();
    };
  }, [uid]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-blue-400">Carregando dados do caçador...</div>;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const cmd = input;
    setInput('');
    await parseCommand(cmd, user, pendingBattles);
  };

  const currentClass = getClassById(user.currentClassId);
  const visibleMessages = messages.filter(m => m.timestamp > clearedAt);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-gray-950 text-gray-200 font-sans overflow-hidden">
      
      {/* Sidebar - Profile & Stats */}
      <div className="w-full md:w-80 bg-gray-900 border-r border-blue-900/30 flex flex-col shrink-0 max-h-[45vh] md:max-h-none md:h-full z-20">
        
        {/* Fixed Header inside Sidebar */}
        <div className="shrink-0 p-3 md:p-4 border-b border-blue-900/30 bg-gray-900 shadow-md">
          <div className="flex items-center gap-4 mb-4">
            <img src={user.photoURL || 'https://picsum.photos/seed/hunter/100/100'} alt="Profile" className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]" referrerPolicy="no-referrer" />
            <div>
              <h2 className="font-bold text-base md:text-lg text-blue-100">{user.displayName}</h2>
              <div className="text-xs text-blue-400 font-mono">Nível {user.level} | {currentClass.name}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-950 p-2 md:p-3 rounded-xl border border-blue-900/30 flex items-center gap-2">
              <Coins className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-sm">{user.criptoBlue} CB</span>
            </div>
            <div className="bg-gray-950 p-2 md:p-3 rounded-xl border border-blue-900/30 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-mono text-sm">{user.pvpWins} Vitórias</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content inside Sidebar */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          {user.activeMission && (
            <div className="bg-blue-950/30 rounded-xl p-4 border border-blue-500/30 mb-4 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
              <h3 className="text-xs text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2 font-bold">
                <Zap className="w-3 h-3 animate-pulse" /> Missão em Andamento
              </h3>
              <div className="text-sm font-bold text-blue-100 mb-2">
                {MISSIONS.find(m => m.id === user.activeMission?.missionId)?.name || 'Explorando...'}
              </div>
              <div className="w-full bg-gray-950 rounded-full h-2 mb-2 overflow-hidden border border-blue-900/50">
                <div 
                  className="bg-blue-500 h-full transition-all duration-300 ease-out shadow-[0_0_10px_#3b82f6]" 
                  style={{ width: `${missionProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-blue-400">
                <span>{Math.floor(missionProgress)}%</span>
                <span>{missionProgress >= 100 ? 'CONCLUÍDO!' : 'CAÇANDO...'}</span>
              </div>
              {missionProgress >= 100 && (
                <button 
                  onClick={() => parseCommand('/missao', user, pendingBattles)}
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded font-bold animate-bounce shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                >
                  RESGATAR RECOMPENSA
                </button>
              )}
            </div>
          )}

          {suggestedMission && !user.activeMission && (
            <div className="bg-gray-950 rounded-xl p-4 border border-blue-900/50 mb-4 shadow-inner">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Target className="w-3 h-3 text-red-400" /> Missão Sugerida
            </h3>
            <div className="mb-2">
              <div className="font-bold text-blue-100 text-sm">{suggestedMission.name}</div>
              <div className="text-xs text-gray-500 mt-1">{suggestedMission.description}</div>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase">Recompensas</span>
                <span className="text-xs font-mono text-cyan-400">+{suggestedMission.criptoBlueReward} CB | +{suggestedMission.xpReward} XP</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-gray-500 uppercase">Dificuldade</span>
                <span className={`text-xs font-bold ${suggestedMission.difficulty === 'Fácil' ? 'text-green-400' : suggestedMission.difficulty === 'Médio' ? 'text-yellow-400' : suggestedMission.difficulty === 'Difícil' ? 'text-orange-400' : 'text-red-500'}`}>{suggestedMission.difficulty}</span>
              </div>
            </div>
            <button 
              onClick={async () => {
                setIsStartingMission(true);
                try {
                  await parseCommand('/missao', user, pendingBattles);
                } finally {
                  setIsStartingMission(false);
                }
              }}
              disabled={isStartingMission}
              className={`w-full mt-3 bg-blue-900/30 hover:bg-blue-800/50 text-blue-300 border border-blue-700/50 text-xs py-2 rounded transition-colors font-bold tracking-wider ${isStartingMission ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isStartingMission ? 'INICIANDO...' : 'INICIAR MISSÃO'}
            </button>
          </div>
        )}

        <div className="bg-gray-950 rounded-xl p-4 border border-blue-900/50 mb-4 flex-1 overflow-y-auto">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users className="w-3 h-3" /> Caçadores Online ({onlineUsers.filter(u => u.isOnline).length})
          </h3>
          <div className="space-y-2">
            {onlineUsers.filter(u => u.isOnline).map(u => (
              <div key={u.uid} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></div>
                <span className="truncate">{u.displayName}</span>
                <span className="text-xs text-gray-500 ml-auto">Lv.{u.level}</span>
              </div>
            ))}
          </div>
        </div>

        {pendingBattles.length > 0 && (
          <div className="bg-red-950/50 rounded-xl p-4 border border-red-900/50 mb-4 animate-pulse">
            <h3 className="text-xs text-red-400 uppercase tracking-wider mb-2 font-bold">
              ⚔️ Desafio Pendente
            </h3>
            <p className="text-sm text-red-200 mb-2">{pendingBattles[0].challengerName} te desafiou!</p>
            <div className="flex gap-2">
              <button onClick={() => parseCommand('/aceitar', user, pendingBattles)} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-1.5 rounded">Aceitar</button>
              <button onClick={() => parseCommand('/recusar', user, pendingBattles)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold py-1.5 rounded">Recusar</button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-[url('https://picsum.photos/seed/dark-fantasy/1920/1080?blur=10')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-sm"></div>
        
        {/* Header */}
        <div className="relative z-10 h-14 border-b border-blue-900/30 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-md">
          <div className="flex items-center">
            <Shield className="w-5 h-5 text-blue-500 mr-2" />
            <h1 className="font-bold text-blue-100 tracking-widest">HUNTER BLUE <span className="text-blue-500/50 font-normal hidden md:inline">| CHAT GLOBAL</span></h1>
          </div>
          <button
            onClick={() => setClearedAt(Date.now())}
            className="text-xs bg-gray-800 hover:bg-red-900/80 text-gray-300 hover:text-red-200 px-3 py-1.5 rounded border border-gray-700 hover:border-red-500/50 transition-colors flex items-center gap-1"
            title="Limpar mensagens do chat"
          >
            <Trash2 className="w-3 h-3" /> Limpar
          </button>
        </div>

        {/* Messages */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4">
          {visibleMessages.map((msg, idx) => {
            if (msg.type === 'system') {
              return (
                <div key={msg.id || idx} className="flex justify-center">
                  <div className="bg-blue-900/20 border border-blue-500/30 text-blue-300 text-xs px-4 py-2 rounded-full font-mono max-w-2xl text-center">
                    {msg.text}
                  </div>
                </div>
              );
            }
            if (msg.type === 'gacha') {
              return (
                <div key={msg.id || idx} className="flex justify-center">
                  <div className="bg-purple-900/20 border border-purple-500/50 text-purple-300 text-sm px-6 py-3 rounded-xl font-bold max-w-2xl text-center shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                    ✨ {msg.text}
                  </div>
                </div>
              );
            }
            if (msg.type === 'combat') {
              return (
                <div key={msg.id || idx} className="flex justify-center">
                  <div className="bg-red-900/20 border border-red-500/50 text-red-300 text-sm px-6 py-3 rounded-xl font-mono max-w-2xl shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    ⚔️ {msg.text}
                  </div>
                </div>
              );
            }
            return (
              <div key={msg.id || idx} className="flex gap-3 max-w-3xl">
                <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center shrink-0 border border-gray-700 text-xs font-bold text-gray-400">
                  {msg.authorName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`font-bold text-sm ${msg.authorUid === uid ? 'text-blue-400' : 'text-gray-300'}`}>{msg.authorName}</span>
                    <span className="text-[10px] text-gray-600">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-gray-200 text-sm leading-relaxed bg-gray-900/50 p-3 rounded-r-xl rounded-bl-xl border border-gray-800">
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="relative z-10 p-4 bg-gray-900/80 backdrop-blur-md border-t border-blue-900/30">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite um comando (ex: /missao, /gacha, /perfil) ou converse..."
              className="flex-1 bg-gray-950 border border-blue-900/50 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)]"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="mt-2 flex gap-4 text-xs text-gray-500 font-mono">
            <span>Atalhos:</span>
            <button onClick={() => setInput('/missao')} className="hover:text-blue-400 transition-colors">/missao</button>
            <button onClick={() => setInput('/gacha')} className="hover:text-blue-400 transition-colors">/gacha</button>
            <button onClick={() => setInput('/perfil')} className="hover:text-blue-400 transition-colors">/perfil</button>
            <button onClick={() => setInput('/ajuda')} className="hover:text-blue-400 transition-colors">/ajuda</button>
          </div>
        </div>
      </div>
    </div>
  );
}
