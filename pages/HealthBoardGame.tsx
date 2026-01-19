
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AvatarData } from '../types';
import { dbService } from '../services/dbService';
import { HEALTH_QUESTIONS } from '../constants';
import { GoogleGenAI } from "@google/genai";
import { 
  Dice6, X, MessageCircle, 
  Sparkles, ClipboardList, Trophy, 
  Stethoscope, HeartPulse, AlertTriangle, ShieldCheck,
  Zap, Ghost, Bot, User as UserIcon, Star, Heart, Timer
} from 'lucide-react';
import Swal from 'sweetalert2';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

type TileType = 'start' | 'quiz' | 'habit' | 'chance' | 'danger' | 'hospital' | 'gym';

interface BoardTile {
  id: number;
  type: TileType;
  label: string;
  icon: string;
  color: string;
  cost: number;
  owner: 'player' | 'ai' | null;
}

const INITIAL_TILES: BoardTile[] = [
  { id: 0, type: 'start', label: 'จุดเริ่ม', icon: '🏁', color: 'bg-emerald-400', cost: 0, owner: null },
  { id: 1, type: 'habit', label: 'ล้างมือ', icon: '🧼', color: 'bg-blue-100', cost: 30, owner: null },
  { id: 2, type: 'quiz', label: 'ควิซด่วน', icon: '❓', color: 'bg-indigo-100', cost: 0, owner: null },
  { id: 3, type: 'habit', label: 'ผักสลัด', icon: '🥗', color: 'bg-lime-100', cost: 40, owner: null },
  { id: 4, type: 'chance', label: 'โชคชะตา', icon: '🎲', color: 'bg-purple-100', cost: 0, owner: null },
  { id: 5, type: 'habit', label: 'แปรงฟัน', icon: '🦷', color: 'bg-blue-100', cost: 50, owner: null },
  { id: 6, type: 'danger', label: 'ขนมหวาน', icon: '🍭', color: 'bg-rose-100', cost: 0, owner: null },
  { id: 7, type: 'habit', label: 'ดื่มน้ำ', icon: '💧', color: 'bg-blue-100', cost: 60, owner: null },
  { id: 8, type: 'gym', label: 'วิ่งจ๊อกกิ้ง', icon: '🏃', color: 'bg-orange-100', cost: 70, owner: null },
  { id: 9, type: 'quiz', label: 'ควิซด่วน', icon: '❓', color: 'bg-indigo-100', cost: 0, owner: null },
  { id: 10, type: 'hospital', label: 'พักฟื้น', icon: '🏥', color: 'bg-slate-300', cost: 0, owner: null },
  { id: 11, type: 'habit', label: 'ว่ายน้ำ', icon: '🏊', color: 'bg-cyan-100', cost: 80, owner: null },
  { id: 12, type: 'chance', label: 'โชคชะตา', icon: '🎲', color: 'bg-purple-100', cost: 0, owner: null },
  { id: 13, type: 'habit', label: 'อ่านหนังสือ', icon: '📖', color: 'bg-amber-100', cost: 90, owner: null },
  { id: 14, type: 'habit', label: 'ผลไม้สด', icon: '🍎', color: 'bg-rose-100', cost: 100, owner: null },
  { id: 15, type: 'gym', label: 'เล่นโยคะ', icon: '🧘', color: 'bg-emerald-100', cost: 110, owner: null },
  { id: 16, type: 'danger', label: 'นอนดึก', icon: '🦉', color: 'bg-indigo-900 text-white', cost: 0, owner: null },
  { id: 17, type: 'habit', label: 'กวาดบ้าน', icon: '🧹', color: 'bg-orange-100', cost: 120, owner: null },
  { id: 18, type: 'quiz', label: 'ควิซด่วน', icon: '❓', color: 'bg-indigo-100', cost: 0, owner: null },
  { id: 19, type: 'habit', label: 'ดื่มนม', icon: '🥛', color: 'bg-slate-100', cost: 130, owner: null },
  { id: 20, type: 'danger', label: 'น้ำอัดลม', icon: '🥤', color: 'bg-rose-200', cost: 0, owner: null },
  { id: 21, type: 'habit', label: 'เดินขึ้นเขา', icon: '🪜', color: 'bg-blue-100', cost: 140, owner: null },
  { id: 22, type: 'chance', label: 'โชคชะตา', icon: '🎲', color: 'bg-purple-100', cost: 0, owner: null },
  { id: 23, type: 'habit', label: 'เล่นกีฬา', icon: '⚽', color: 'bg-emerald-100', cost: 150, owner: null },
  { id: 24, type: 'habit', label: 'อาบน้ำ', icon: '🚿', color: 'bg-cyan-100', cost: 160, owner: null },
  { id: 25, type: 'quiz', label: 'ควิซด่วน', icon: '❓', color: 'bg-indigo-100', cost: 0, owner: null },
  { id: 26, type: 'danger', label: 'จ้องจอ', icon: '📱', color: 'bg-slate-700 text-white', cost: 0, owner: null },
  { id: 27, type: 'habit', label: 'สมาธิ', icon: '🧘‍♂️', color: 'bg-indigo-100', cost: 170, owner: null },
];

const HealthBoardGame: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [tiles, setTiles] = useState<BoardTile[]>(INITIAL_TILES);
  const [playerPos, setPlayerPos] = useState(0);
  const [aiPos, setAiPos] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(1);
  const [avatar, setAvatar] = useState<AvatarData | null>(null);
  const [showQuiz, setShowQuiz] = useState<any | null>(null);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [gameMessage, setGameMessage] = useState('ยินดีต้อนรับฮีโร่! ทอยเต๋าเพื่อประลองสุขภาพกับพี่หมอ AI กัน');
  const [aiHp, setAiHp] = useState(500);
  const [playerHp, setPlayerHp] = useState(500);
  const [logs, setLogs] = useState<string[]>(['🎮 เกมประลองสุขภาพเริ่มขึ้นแล้ว!']);
  const [playerSkip, setPlayerSkip] = useState(0);
  const [aiSkip, setAiSkip] = useState(0);
  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isGameOver, setIsGameOver] = useState(false);

  // UseRef for robust turn management
  // Fix: Use ReturnType<typeof setTimeout> to define timeout reference in a way that works in browser environment without requiring NodeJS namespace.
  const aiTurnProcessing = useRef(false);
  const aiSafetyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getAiReaction = async (eventDescription: string) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `คุณคือ "พี่หมอ AI" โค้ชสุขภาพใจดีที่กำลังเล่นเกมเศรษฐีสุขภาพกับเด็กประถมอยู่
        เหตุการณ์ที่เกิดขึ้น: ${eventDescription}
        ให้พูดประโยคสั้นๆ (ไม่เกิน 1 ประโยค) ที่ให้ความรู้สุขภาพหรือให้กำลังใจแบบสนุกๆ พร้อมอีโมจิ`,
        config: { temperature: 0.9 }
      });
      if (response.text) setGameMessage(response.text);
    } catch (e) {
      console.error("AI Commentary Error", e);
    }
  };

  useEffect(() => {
    dbService.getAvatar(user.id).then(setAvatar);
    return () => {
      if (aiSafetyTimeout.current) clearTimeout(aiSafetyTimeout.current);
    };
  }, [user.id]);

  useEffect(() => {
    if (isGameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 10));
  }, []);

  const triggerTurnBanner = useCallback(() => {
    setShowTurnBanner(true);
    setTimeout(() => setShowTurnBanner(false), 1200);
  }, []);

  const checkWinner = useCallback((reason: string) => {
    if (isGameOver) return;
    setIsGameOver(true);
    const isWinner = playerHp > aiHp;
    
    if (isWinner) dbService.updateAvatarStats(user.id, 100);
    
    Swal.fire({
      title: isWinner ? 'คุณคือแชมป์สุขภาพ! 🏆' : 'พี่หมอ AI ชนะไปรอบนี้! 🤖',
      text: `${reason} - ${isWinner ? 'สุดยอดวินัย! รับโบนัส 100 EXP' : 'พี่หมอดูแลตัวเองดีกว่านิดนึง คราวหน้าเอาใหม่นะ!'}`,
      icon: isWinner ? 'success' : 'error',
      confirmButtonText: 'กลับหมู่บ้าน'
    }).then(() => navigate('/home'));
  }, [playerHp, aiHp, user.id, navigate, isGameOver]);

  const handleTimeOut = () => {
    checkWinner('หมดเวลาประลองแล้ว!');
  };

  const endTurn = useCallback(() => {
    if (isGameOver) return;

    // IMPORTANT: Clear AI processing flags
    aiTurnProcessing.current = false;
    setIsAiThinking(false);
    setIsRolling(false);
    if (aiSafetyTimeout.current) clearTimeout(aiSafetyTimeout.current);

    if (playerHp <= 0 || aiHp <= 0) {
      checkWinner(playerHp <= 0 ? 'พลังงานของคุณหมดลงแล้ว' : 'พี่หมอ AI พลังงานหมดแล้ว');
      return;
    }

    if (turn === 'player') {
      if (aiSkip > 0) {
        setAiSkip(prev => prev - 1);
        addLog('🏥 พี่หมอ AI กำลังพักฟื้น... ตาของคุณอีกครั้ง!');
        triggerTurnBanner();
      } else {
        setTurn('ai');
        triggerTurnBanner();
      }
    } else {
      if (playerSkip > 0) {
        setPlayerSkip(prev => prev - 1);
        addLog('🏥 ร่างกายคุณต้องการการพักผ่อน... พี่หมอขอเดินอีกรอบ!');
        triggerTurnBanner();
      } else {
        setTurn('player');
        triggerTurnBanner();
      }
    }
  }, [turn, playerHp, aiHp, aiSkip, playerSkip, triggerTurnBanner, addLog, checkWinner, isGameOver]);

  const handleTileEffect = async (mover: 'player' | 'ai', tile: BoardTile) => {
    const isPlayer = mover === 'player';
    const moverName = isPlayer ? 'คุณ' : 'พี่หมอ AI';
    
    getAiReaction(`${moverName} ตกที่ช่อง ${tile.label} (${tile.type})`);

    switch (tile.type) {
      case 'habit':
      case 'gym':
        if (tile.owner === null) {
          if (isPlayer) {
            const res = await Swal.fire({
              title: tile.label,
              text: `ต้องการสร้างนิสัยสุขภาพ "${tile.label}" หรือไม่? (ใช้ ${tile.cost} HP)`,
              icon: 'question',
              showCancelButton: true,
              confirmButtonText: 'เริ่มทำนิสัยนี้!',
              cancelButtonText: 'ข้ามไปก่อน'
            });
            if (res.isConfirmed) {
              if (playerHp >= tile.cost) {
                setPlayerHp(prev => prev - tile.cost);
                const newTiles = [...tiles];
                newTiles[tile.id].owner = 'player';
                setTiles(newTiles);
                addLog(`🏠 คุณเริ่มสร้างนิสัย "${tile.label}"`);
              } else {
                Swal.fire('HP ไม่พอ!', 'รักษาพลังงานเพิ่มก่อนนะ', 'warning');
              }
            }
          } else {
            // AI simple logic
            if (aiHp > tile.cost + 100) {
              setAiHp(prev => prev - tile.cost);
              const newTiles = [...tiles];
              newTiles[tile.id].owner = 'ai';
              setTiles(newTiles);
              addLog(`🤖 พี่หมอ AI ฝึกนิสัย "${tile.label}"`);
            }
          }
        } else if (tile.owner === mover) {
          const heal = Math.floor(tile.cost * 0.5);
          if (isPlayer) {
            setPlayerHp(prev => Math.min(500, prev + heal));
            addLog(`🌟 คุณรักษาวินัย ${tile.label}! (+${heal} HP)`);
          } else {
            setAiHp(prev => Math.min(500, prev + heal));
            addLog(`🌟 พี่หมอ AI สุขภาพดีขึ้นจาก ${tile.label} (+${heal} HP)`);
          }
        } else {
          const penalty = Math.floor(tile.cost * 0.4);
          if (isPlayer) {
            setPlayerHp(prev => Math.max(0, prev - penalty));
            setAiHp(prev => Math.min(500, prev + penalty));
            addLog(`💰 คุณเรียนรู้วิธีสุขภาพดีจากพี่หมอ (เสีย ${penalty} HP)`);
          } else {
            setAiHp(prev => Math.max(0, prev - penalty));
            setPlayerHp(prev => Math.min(500, prev + penalty));
            addLog(`💰 พี่หมอจ่ายค่าตอบแทนให้คุณที่ช่วยสอน (${penalty} HP)`);
          }
        }
        break;

      case 'quiz':
        if (isPlayer) {
          setShowQuiz(HEALTH_QUESTIONS[Math.floor(Math.random() * HEALTH_QUESTIONS.length)]);
          return; // Modal handles endTurn
        } else {
          setIsAiThinking(true);
          setTimeout(() => {
            const correct = Math.random() > 0.3;
            if (correct) {
              setAiHp(prev => Math.min(500, prev + 50));
              addLog(`✅ พี่หมอ AI ตอบควิซถูกต้อง!`);
            } else {
              setAiHp(prev => Math.max(0, prev - 30));
              addLog(`❌ พี่หมอ AI ตอบควิซผิด!`);
            }
            setIsAiThinking(false);
            setTimeout(endTurn, 800);
          }, 1500);
          return;
        }

      case 'danger':
        const dPenalty = 80;
        if (isPlayer) setPlayerHp(prev => Math.max(0, prev - dPenalty));
        else setAiHp(prev => Math.max(0, prev - dPenalty));
        addLog(`⚠️ ${moverName} ${tile.label} เสียพลังงาน ${dPenalty} HP`);
        break;

      case 'chance':
        const effects = [
          { msg: 'โชคดี! ได้รับอาหารเสริม', val: 100 },
          { msg: 'โชคร้าย! ลืมล้างมือ', val: -60 },
          { msg: 'โชคดี! ค้นพบสูตรสมูทตี้', val: 120 },
          { msg: 'ขโมย HP!', val: 50, type: 'steal' }
        ];
        const effect = effects[Math.floor(Math.random() * effects.length)];
        if (effect.type === 'steal') {
          if (isPlayer) { setPlayerHp(v => Math.min(500, v + 50)); setAiHp(v => Math.max(0, v - 50)); }
          else { setAiHp(v => Math.min(500, v + 50)); setPlayerHp(v => Math.max(0, v - 50)); }
        } else {
          if (isPlayer) setPlayerHp(v => Math.min(500, Math.max(0, v + effect.val)));
          else setAiHp(v => Math.min(500, Math.max(0, v + (effect.val || 0))));
        }
        addLog(`🎲 ดวง: ${effect.msg}`);
        break;

      case 'hospital':
        const hHeal = 50;
        if (isPlayer) { setPlayerHp(v => Math.min(500, v + hHeal)); setPlayerSkip(1); }
        else { setAiHp(v => Math.min(500, v + hHeal)); setAiSkip(1); }
        addLog(`🏥 ${moverName} พักฟื้น (+${hHeal} HP, หยุดพัก 1 ตา)`);
        break;
    }

    setTimeout(endTurn, 1000);
  };

  const handleMove = useCallback((mover: 'player' | 'ai', steps: number) => {
    setIsRolling(false);
    if (mover === 'player') {
      const nextPos = (playerPos + steps) % tiles.length;
      if (nextPos < playerPos) {
        setPlayerHp(prev => Math.min(500, prev + 100));
        addLog(`🚩 ยินดีด้วย! คุณเดินครบรอบ รับโบนัส 100 HP`);
        dbService.updateAvatarStats(user.id, 20);
      }
      setPlayerPos(nextPos);
      setTimeout(() => handleTileEffect(mover, tiles[nextPos]), 600);
    } else {
      const nextPos = (aiPos + steps) % tiles.length;
      if (nextPos < aiPos) {
        setAiHp(prev => Math.min(500, prev + 100));
        addLog(`🚩 พี่หมอ AI เดินครบรอบ! (+100 HP)`);
      }
      setAiPos(nextPos);
      setTimeout(() => handleTileEffect(mover, tiles[nextPos]), 600);
    }
  }, [playerPos, aiPos, tiles, user.id, addLog]);

  // AI Turn Sequence - Fully controlled
  useEffect(() => {
    if (turn === 'ai' && !showTurnBanner && !isRolling && aiSkip === 0 && !isAiThinking && !isGameOver) {
      if (aiTurnProcessing.current) return;
      
      aiTurnProcessing.current = true;
      setIsAiThinking(true);
      
      // Safety timeout in case things get stuck
      aiSafetyTimeout.current = setTimeout(() => {
        if (aiTurnProcessing.current && isAiThinking) {
           console.warn("AI Turn timed out, resetting...");
           endTurn();
        }
      }, 10000);
      
      const aiTimer = setTimeout(() => {
        if (isGameOver) return;
        setIsRolling(true);
        let count = 0;
        const interval = setInterval(() => {
          setDiceValue(Math.floor(Math.random() * 6) + 1);
          count++;
          if (count > 12) {
            clearInterval(interval);
            const final = Math.floor(Math.random() * 6) + 1;
            setDiceValue(final);
            setIsAiThinking(false);
            handleMove('ai', final);
          }
        }, 60);
      }, 1500);

      return () => {
        clearTimeout(aiTimer);
        if (aiSafetyTimeout.current) clearTimeout(aiSafetyTimeout.current);
      };
    }
  }, [turn, showTurnBanner, isRolling, aiSkip, isAiThinking, isGameOver, handleMove]);

  const rollDice = () => {
    if (isRolling || turn !== 'player' || playerSkip > 0 || showTurnBanner || isGameOver) return;
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 12) {
        clearInterval(interval);
        const final = Math.floor(Math.random() * 6) + 1;
        setDiceValue(final);
        handleMove('player', final);
      }
    }, 60);
  };

  const handleAnswer = (idx: number) => {
    const isCorrect = idx === showQuiz.answer;
    setShowQuiz(null);
    if (isCorrect) {
      Swal.fire('ถูกต้อง! ✅', 'รับโบนัส 60 HP!', 'success');
      setPlayerHp(prev => Math.min(500, prev + 60));
      dbService.updateAvatarStats(user.id, 20);
    } else {
      Swal.fire('ผิดครับ ❌', 'เสียพลังงาน 40 HP', 'error');
      setPlayerHp(prev => Math.max(0, prev - 40));
    }
    endTurn();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderBoard = () => {
    const rows = 6;
    const cols = 10;
    const grid = [];
    for (let r = 0; r < rows; r++) {
      const rowElements = [];
      for (let c = 0; c < cols; c++) {
        let tileIndex = -1;
        if (r === 0) tileIndex = c;
        else if (c === cols - 1) tileIndex = 9 + r;
        else if (r === rows - 1) tileIndex = 14 + (cols - 1 - c);
        else if (c === 0) tileIndex = 24 + (rows - 1 - r);

        if (tileIndex >= 0 && tileIndex < tiles.length) {
          const tile = tiles[tileIndex];
          const hasPlayer = playerPos === tileIndex;
          const hasAi = aiPos === tileIndex;
          rowElements.push(
            <div key={tileIndex} className={`relative w-full aspect-square rounded-2xl border-4 flex flex-col items-center justify-center p-1 transition-all duration-300 shadow-md ${tile.color} ${tile.owner === 'player' ? 'ring-4 ring-blue-500 border-white' : tile.owner === 'ai' ? 'ring-4 ring-rose-500 border-white' : 'border-white/50'} ${hasPlayer || hasAi ? 'z-20 scale-105 bg-white ring-8 ring-white/30' : ''}`}>
              <span className="text-xl sm:text-2xl drop-shadow-md">{tile.icon}</span>
              <span className="text-[7px] font-black uppercase text-center hidden md:block mt-1 leading-none">{tile.label}</span>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {hasPlayer && <div className="w-9 h-9 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-base shadow-xl border-4 border-white animate-bounce-short z-30 translate-x-[-8px] translate-y-[-8px]">{avatar?.base_emoji}</div>}
                {hasAi && <div className="w-9 h-9 bg-rose-600 rounded-2xl flex items-center justify-center text-white text-base shadow-xl border-4 border-white animate-wiggle z-30 translate-x-[8px] translate-y-[8px]">🤖</div>}
              </div>
              {tile.owner && (
                <div className={`absolute top-0 right-0 p-1 rounded-bl-xl shadow-sm ${tile.owner === 'player' ? 'bg-blue-600' : 'bg-rose-600'}`}>
                   {tile.owner === 'player' ? <UserIcon size={8} className="text-white"/> : <Bot size={8} className="text-white"/>}
                </div>
              )}
            </div>
          );
        } else { rowElements.push(<div key={`${r}-${c}`} className="w-full aspect-square opacity-0"></div>); }
      }
      grid.push(<div key={r} className="grid grid-cols-10 gap-1.5 w-full">{rowElements}</div>);
    }
    return grid;
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 pb-20 p-4 relative">
      {showTurnBanner && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none bg-black/10 backdrop-blur-[2px]">
           <div className={`px-20 py-10 rounded-[4rem] border-8 border-white shadow-2xl animate-in zoom-in duration-300 flex items-center gap-8 ${turn === 'player' ? 'bg-blue-600' : 'bg-rose-600'}`}>
              <div className="text-7xl">{turn === 'player' ? avatar?.base_emoji : '🤖'}</div>
              <div className="text-white text-5xl font-black italic tracking-tight">{turn === 'player' ? 'ตาของคุณแล้ว!' : 'พี่หมอกำลังเดิน...'}</div>
           </div>
        </div>
      )}

      <div className="w-full lg:w-80 space-y-6 shrink-0">
        <div className={`p-6 rounded-[2.5rem] bg-white border-4 shadow-xl text-center flex items-center justify-center gap-4 ${timeLeft < 60 ? 'border-rose-500 animate-pulse text-rose-500' : 'border-blue-500 text-blue-600'}`}>
           <Timer size={32} />
           <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">เวลาประลอง</span>
              <span className="text-4xl font-black tracking-tighter leading-none">{formatTime(timeLeft)}</span>
           </div>
        </div>

        <div className={`p-8 rounded-[3.5rem] bg-white border-4 shadow-2xl transition-all duration-500 relative ${turn === 'player' ? 'border-blue-500 scale-105 shadow-blue-200' : 'border-white opacity-80'}`}>
          <div className="flex items-center gap-4 mb-6 relative z-10">
             <div className="text-4xl bg-blue-100 p-4 rounded-3xl">{avatar?.base_emoji}</div>
             <div className="flex-grow">
                <p className="font-black text-slate-800 text-sm truncate">{user.fullname}</p>
                <div className="h-5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden border-2 border-slate-200 shadow-inner">
                   <div className={`h-full transition-all duration-700 ${playerHp < 150 ? 'bg-rose-500' : 'bg-blue-600'}`} style={{ width: `${(playerHp/500)*100}%` }}></div>
                </div>
                <p className="text-[10px] font-black text-blue-600 uppercase mt-1 tracking-widest">{playerHp} HP</p>
             </div>
             {playerSkip > 0 && <Ghost className="text-slate-400 animate-pulse" size={24} />}
          </div>
          <button onClick={rollDice} disabled={isRolling || turn !== 'player' || playerSkip > 0 || showTurnBanner || isGameOver} className={`w-full py-6 rounded-[2.5rem] font-black shadow-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1 text-xl ${isRolling || turn !== 'player' || playerSkip > 0 || showTurnBanner || isGameOver ? 'bg-slate-300 text-slate-500' : 'bg-blue-600 text-white hover:brightness-110 shadow-blue-100'}`}>
            <div className="flex items-center gap-3"><Dice6 className={isRolling ? 'animate-spin' : ''} /> {playerSkip > 0 ? `พักผ่อน` : 'ทอยลูกเต๋า'}</div>
          </button>
        </div>

        <div className={`p-8 rounded-[3.5rem] bg-white border-4 shadow-2xl transition-all duration-500 relative ${turn === 'ai' ? 'border-rose-500 scale-105 shadow-rose-200' : 'border-white opacity-80'}`}>
          <div className="flex items-center gap-4">
             <div className="text-4xl bg-rose-100 p-4 rounded-3xl">🤖</div>
             <div className="flex-grow">
                <p className="font-black text-slate-800 text-sm">พี่หมอ AI Master</p>
                <div className="h-5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden border-2 border-slate-200 shadow-inner">
                   <div className={`h-full transition-all duration-700 ${aiHp < 150 ? 'bg-rose-600' : 'bg-rose-500'}`} style={{ width: `${(aiHp/500)*100}%` }}></div>
                </div>
                <p className="text-[10px] font-black text-rose-600 uppercase mt-1 tracking-widest">{aiHp} HP</p>
             </div>
             {aiSkip > 0 && <Ghost className="text-slate-400 animate-pulse" size={24} />}
          </div>
          {turn === 'ai' && !isRolling && !showTurnBanner && !isGameOver && (
            <div className="text-center mt-6 animate-pulse text-rose-500 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 bg-rose-50 py-3 rounded-2xl border border-rose-100 shadow-inner">
              <div className="w-2 h-2 bg-rose-500 rounded-full"></div> พี่หมอกำลังวิเคราะห์แผน...
            </div>
          )}
        </div>

        <div className="bg-slate-900 text-white rounded-[3.5rem] p-8 shadow-2xl h-[340px] overflow-hidden flex flex-col border-4 border-slate-800">
          <div className="flex items-center gap-2 mb-6 text-emerald-400 font-black text-xs uppercase tracking-widest"><ClipboardList size={16} /> บันทึกการประลอง</div>
          <div className="flex-grow overflow-y-auto no-scrollbar space-y-4">
            {logs.map((log, i) => <div key={i} className="text-[12px] font-bold border-l-4 border-emerald-500/50 pl-4 py-3 opacity-95 animate-in slide-in-from-left-4 bg-white/5 rounded-r-2xl border border-white/5 shadow-inner">{log}</div>)}
          </div>
        </div>
        <button onClick={() => navigate('/home')} className="w-full py-5 bg-white/80 rounded-3xl font-black text-slate-400 hover:text-rose-500 transition-all border-4 border-white shadow-xl flex items-center justify-center gap-3 active:scale-95"><X size={24} /> ออกจากการประลอง</button>
      </div>

      <div className="flex-grow bg-white/40 backdrop-blur-2xl rounded-[5rem] p-6 sm:p-12 border-8 border-white shadow-2xl overflow-x-auto no-scrollbar flex flex-col items-center">
        <div className="min-w-[940px] lg:min-w-0 w-full">
          <div className="space-y-1.5 drop-shadow-2xl">{renderBoard()}</div>
          <div className="mt-16 flex items-center justify-center relative">
             <div className="bg-white/95 backdrop-blur-xl px-16 py-12 rounded-[5rem] shadow-2xl border-4 border-blue-50 text-center max-w-3xl relative overflow-hidden group border-b-[12px] border-b-blue-100/50">
                <div className="flex items-center justify-center gap-4 mb-6 relative z-10">
                  <div className="w-16 h-16 bg-blue-100 rounded-[2rem] flex items-center justify-center shadow-inner"><MessageCircle size={32} className="text-blue-500 animate-bounce" /></div>
                  <div className="text-left"><span className="text-[13px] font-black text-blue-600 uppercase tracking-widest block">Village Doctor AI</span><div className="flex gap-1"><Star size={10} fill="#f59e0b"/><Star size={10} fill="#f59e0b"/><Star size={10} fill="#f59e0b"/></div></div>
                </div>
                <p className="text-3xl font-black text-slate-800 leading-tight mb-8 relative z-10">{isAiThinking ? "กำลังประมวลผลความรู้สุขภาพ..." : isGameOver ? "จบการแข่งขัน!" : `"${gameMessage}"`}</p>
                <div className="flex justify-center gap-8 border-t-2 pt-8 border-slate-100 relative z-10">
                   <div className="flex flex-col items-center gap-2 text-amber-500"><Trophy size={20} /><span className="text-[10px] font-black text-slate-500 uppercase">รอบกระดาน +100 HP</span></div>
                   <div className="flex flex-col items-center gap-2 text-emerald-500"><ShieldCheck size={20} /><span className="text-[10px] font-black text-slate-500 uppercase">ควิซสมองไว +60 HP</span></div>
                   <div className="flex flex-col items-center gap-2 text-rose-500"><Heart size={20} /><span className="text-[10px] font-black text-slate-500 uppercase">HP มากกว่าชนะ!</span></div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {showQuiz && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white rounded-[5rem] w-full max-w-2xl p-16 shadow-2xl animate-in zoom-in border-[16px] border-indigo-50 relative overflow-hidden">
              <div className="text-center mb-12 relative z-10">
                 <div className="w-32 h-32 bg-indigo-100 rounded-[3rem] flex items-center justify-center text-7xl mx-auto mb-8 animate-bounce border-4 border-white shadow-xl">{showQuiz.icon || '❓'}</div>
                 <h3 className="text-4xl font-black text-slate-800 leading-tight">{showQuiz.question}</h3>
                 <div className="mt-8"><span className="px-8 py-3 bg-indigo-600 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100">รางวัล: 60 HP</span></div>
              </div>
              <div className="grid grid-cols-1 gap-5 relative z-10">
                 {(showQuiz.options || [showQuiz.option1, showQuiz.option2, showQuiz.option3, showQuiz.option4]).filter(Boolean).map((opt: string, idx: number) => (
                   <button key={idx} onClick={() => handleAnswer(idx)} className="w-full p-8 bg-slate-50 hover:bg-white border-4 border-transparent hover:border-indigo-500 rounded-[2.5rem] text-left font-black text-slate-700 transition-all flex items-center gap-6 group shadow-lg active:scale-95">
                     <span className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md text-indigo-600 font-black text-2xl border-2 border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">{idx + 1}</span>
                     <span className="flex-grow text-xl">{opt}</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes bounce-short { 0%, 100% { transform: translate(-8px, -8px); } 50% { transform: translate(-8px, -20px); } }
        .animate-bounce-short { animation: bounce-short 1s cubic-bezier(0.28, 0.84, 0.42, 1) infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes wiggle { 0%, 100% { transform: rotate(-5deg) translate(8px, 8px); } 50% { transform: rotate(5deg) translate(8px, 8px); } }
        .animate-wiggle { animation: wiggle 0.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default HealthBoardGame;
