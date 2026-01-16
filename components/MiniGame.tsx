
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Card } from '../types';
import { CheckCircle2, XCircle, Award, Brain, Star, Loader2, RefreshCw, Sparkles, Layers, Zap } from 'lucide-react';
import Swal from 'sweetalert2';

interface MiniGameProps {
  userId: string;
  onEnd: (score: number) => void;
}

const HealthQuiz: React.FC<MiniGameProps> = ({ userId, onEnd }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizSet, setQuizSet] = useState<any[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [awardedCard, setAwardedCard] = useState<Card | null>(null);
  const [revealStage, setRevealStage] = useState<'idle' | 'shaking' | 'revealed'>('idle');

  const startQuiz = async () => {
    setLoading(true);
    try {
      const pool = await dbService.getQuizPool();
      if (pool.length === 0) {
        Swal.fire("คลังข้อสอบว่างเปล่า!", "กรุณาแจ้งคุณครูเพื่อเพิ่มคำถามนะจ๊ะ", "info");
        return;
      }
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      // สุ่มมา 20 ข้อเพื่อพิสูจน์ความเป็นฮีโร่
      setQuizSet(shuffled.slice(0, 20));
      setCurrentIdx(0);
      setCorrectCount(0);
      setSelectedIdx(null);
      setIsAnswered(false);
      setIsPlaying(true);
      setShowResult(false);
      setAwardedCard(null);
      setRevealStage('idle');
    } catch (e) {
      console.error("Quiz start error", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (idx: number) => {
    if (isAnswered) return;
    setSelectedIdx(idx);
    setIsAnswered(true);
    
    const correctAns = parseInt(quizSet[currentIdx].answer);
    const isCorrect = idx === correctAns;
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }
    
    setTimeout(async () => {
      if (currentIdx < quizSet.length - 1) {
        setCurrentIdx(prev => prev + 1);
        setSelectedIdx(null);
        setIsAnswered(false);
      } else {
        const finalScore = isCorrect ? correctCount + 1 : correctCount;
        setShowResult(true);
        
        // --- เงื่อนไขการรับการ์ด: ต้องตอบถูกครบ 20 ข้อเป๊ะ! ---
        if (finalScore >= 20) {
          try {
            const rewardRes = await dbService.awardRandomCard(userId);
            if (rewardRes.success) {
              setAwardedCard(rewardRes.card);
            }
          } catch (e) {
            console.error("Award card error", e);
          }
        }
      }
    }, 1200);
  };

  const triggerReveal = () => {
    setRevealStage('shaking');
    setTimeout(() => {
      setRevealStage('revealed');
    }, 1500);
  };

  if (loading) return (
    <div className="w-full max-w-[600px] bg-white rounded-[3rem] p-20 text-center shadow-2xl flex flex-col items-center">
      <RefreshCw className="w-16 h-16 text-blue-500 animate-spin mb-6" />
      <p className="font-black text-blue-600 uppercase tracking-widest">กำลังดึงข้อสอบจากหอสมุด...</p>
    </div>
  );

  if (!isPlaying) {
    return (
      <div className="w-full max-w-[600px] bg-white rounded-[3rem] p-12 text-center shadow-2xl border-8 border-blue-50 flex flex-col items-center animate-in zoom-in">
        <div className="w-28 h-28 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-[2.5rem] flex items-center justify-center text-6xl mb-8 animate-bounce shadow-inner">🧠</div>
        <h2 className="text-3xl font-black text-slate-800 mb-4">ภารกิจฮีโร่สมองไว! ⚡</h2>
        <p className="text-slate-500 font-bold mb-6 leading-relaxed max-w-sm">
          พิสูจน์ความรู้ด้วยควิซสุขภาพ 20 ข้อ <br />
          <span className="text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full text-sm mt-3 inline-block font-black border border-emerald-100">🔥 ตอบถูกครบ 20 ข้อ รับ "การ์ดฮีโร่" ทันที!</span>
        </p>
        <button onClick={startQuiz} className="bg-blue-600 hover:bg-blue-700 text-white font-black px-16 py-5 rounded-[2rem] shadow-xl shadow-blue-100 transition-all transform hover:scale-105 active:scale-95">เริ่มประลองเลย! 🚀</button>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="w-full max-w-[600px] bg-white rounded-[3rem] p-12 text-center shadow-2xl border-8 border-emerald-50 animate-in zoom-in overflow-hidden relative">
        {awardedCard && (
          <div className="absolute inset-0 z-50 bg-[#161621] p-10 flex flex-col items-center justify-center animate-in fade-in duration-500">
             {revealStage === 'idle' && (
                <div className="text-center space-y-8">
                   <div className="text-indigo-400 font-black text-3xl mb-4 animate-pulse uppercase tracking-[0.2em] italic">⭐ พรสวรรค์ปรากฏแล้ว ⭐</div>
                   <div className="w-48 h-64 bg-indigo-600/20 rounded-[2rem] border-4 border-dashed border-indigo-400/50 flex items-center justify-center text-8xl animate-bounce">🧧</div>
                   <p className="text-white font-bold opacity-60">คุณตอบถูกครบ 20 ข้อ! ยินดีด้วยฮีโร่</p>
                   <button onClick={triggerReveal} className="bg-white text-indigo-600 font-black px-12 py-4 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all text-xl">เปิดซองการ์ด ⚡</button>
                </div>
             )}

             {revealStage === 'shaking' && (
                <div className="text-center space-y-8 animate-wiggle">
                   <div className="text-indigo-400 font-black text-3xl mb-4 uppercase tracking-[0.2em]">กำลังดึงพลังสุขภาพ...</div>
                   <div className="text-9xl">⚡</div>
                </div>
             )}

             {revealStage === 'revealed' && (
                <div className="flex flex-col items-center animate-in zoom-in duration-700">
                   <div className="text-yellow-400 font-black text-2xl mb-8 flex items-center gap-2 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                      <Sparkles /> ยินดีด้วย! คุณได้รับรางวัลการ์ด {awardedCard.rarity} <Sparkles />
                   </div>
                   
                   <div className={`w-72 h-96 rounded-[2rem] p-6 shadow-[0_0_60px_rgba(255,255,255,0.2)] border-8 relative flex flex-col items-center justify-between overflow-hidden group ${awardedCard.rarity === 'Legendary' ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-rose-600 border-yellow-200' : awardedCard.rarity === 'Rare' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-200' : 'bg-gradient-to-br from-blue-400 to-emerald-500 border-blue-100'}`}>
                      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"></div>
                      <div className="w-full flex justify-between items-center relative z-10">
                        <span className="text-[10px] font-black text-white/50">{awardedCard.id}</span>
                        <div className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-widest">{awardedCard.rarity}</div>
                      </div>
                      <div className="relative z-10 w-full h-44 bg-black/10 rounded-2xl flex items-center justify-center text-8xl overflow-hidden border border-white/20 shadow-inner">
                         {awardedCard.image.startsWith('http') ? <img src={awardedCard.image} className="w-full h-full object-cover" /> : <span className="drop-shadow-2xl">{awardedCard.image}</span>}
                      </div>
                      <div className="relative z-10 text-center">
                         <h4 className="text-white font-black text-xl leading-tight drop-shadow-md">{awardedCard.title}</h4>
                         <p className="text-white/80 text-[10px] font-bold mt-1 leading-tight h-8 overflow-hidden italic line-clamp-2">"{awardedCard.description}"</p>
                      </div>
                      <div className="relative z-10 grid grid-cols-3 gap-2 w-full">
                         <div className="bg-black/20 rounded-xl p-1 text-center"><p className="text-[7px] font-black text-white/60 uppercase">HP</p><p className="text-sm font-black text-white">{awardedCard.power_stats.health}</p></div>
                         <div className="bg-black/20 rounded-xl p-1 text-center"><p className="text-[7px] font-black text-white/60 uppercase">INT</p><p className="text-sm font-black text-white">{awardedCard.power_stats.brain}</p></div>
                         <div className="bg-black/20 rounded-xl p-1 text-center"><p className="text-[7px] font-black text-white/60 uppercase">ENG</p><p className="text-sm font-black text-white">{awardedCard.power_stats.energy}</p></div>
                      </div>
                   </div>

                   <button onClick={() => onEnd(correctCount * 10)} className="mt-12 bg-white text-slate-800 font-black px-12 py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center gap-2 hover:bg-slate-100">
                      <Layers size={20}/> เก็บเข้าสมุดสะสมการ์ด
                   </button>
                </div>
             )}
          </div>
        )}

        <Award className="w-28 h-28 text-yellow-400 mx-auto mb-8 drop-shadow-lg" />
        <h2 className="text-4xl font-black text-slate-800 mb-4">เก่งที่สุดในรุ่น!</h2>
        <div className="text-xl font-bold text-slate-500 mb-10">คุณตอบถูก {correctCount} จาก {quizSet.length} ข้อ</div>
        
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="bg-blue-50 p-6 rounded-[2rem] border-2 border-blue-100">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">แต้ม EXP</p>
            <p className="text-3xl font-black text-blue-600">+{correctCount * 10}</p>
          </div>
          <div className="bg-amber-50 p-6 rounded-[2rem] border-2 border-amber-100">
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">เหรียญทอง</p>
            <p className="text-3xl font-black text-amber-600">+{Math.floor(correctCount / 2)}</p>
          </div>
        </div>

        <button 
          onClick={() => onEnd(correctCount * 10)}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-5 rounded-[2rem] shadow-xl transition-all flex items-center justify-center gap-2 text-lg active:scale-95"
        >
          กลับสู่หมู่บ้านฮีโร่ <Star fill="white" size={24} />
        </button>
      </div>
    );
  }

  const currentQ = quizSet[currentIdx];
  const progress = quizSet.length > 0 ? ((currentIdx + 1) / quizSet.length) * 100 : 0;
  const options = currentQ ? [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(o => o) : [];

  if (!currentQ) return null;

  return (
    <div className="w-full max-w-[700px] bg-white rounded-[3.5rem] shadow-2xl border-8 border-white overflow-hidden flex flex-col min-h-[600px] relative">
      <div className="w-full h-3 bg-slate-100 shrink-0 relative overflow-hidden">
        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="px-10 py-6 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <Brain className="text-blue-500" />
          <span className="font-black text-slate-600">ข้อสอบ {currentIdx + 1} / {quizSet.length}</span>
        </div>
        <div className="bg-emerald-50 text-emerald-600 px-4 py-1 rounded-full font-black text-xs flex items-center gap-2 border border-emerald-100">
          <CheckCircle2 size={14} /> ถูก {correctCount}
        </div>
      </div>
      <div className="flex-grow p-12 flex flex-col items-center justify-center text-center">
        <div className="text-7xl mb-8 p-8 bg-blue-50 rounded-[3rem] shadow-inner transform rotate-3">
          {currentQ.icon || '❓'}
        </div>
        <h3 className="text-3xl font-black text-slate-800 leading-tight mb-12">
          {currentQ.question}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {options.map((opt, i) => {
            let style = "bg-slate-50 border-4 border-transparent text-slate-700 hover:border-blue-400 hover:bg-white";
            const correctAns = parseInt(currentQ.answer);
            if (isAnswered) {
              if (i === correctAns) style = "bg-emerald-50 border-emerald-500 text-emerald-700 scale-105 shadow-lg shadow-emerald-50";
              else if (i === selectedIdx) style = "bg-rose-50 border-rose-400 text-rose-700 opacity-80";
              else style = "bg-slate-50 border-transparent text-slate-300 opacity-40 grayscale";
            }
            return (
              <button key={i} disabled={isAnswered} onClick={() => handleAnswer(i)} className={`flex items-center px-8 py-5 rounded-[2rem] font-black text-left transition-all relative ${style}`}>
                <span className="w-8 h-8 rounded-xl bg-white flex items-center justify-center mr-4 text-[10px] font-black shadow-sm text-slate-400">{String.fromCharCode(65 + i)}</span>
                <span className="text-base flex-grow">{opt}</span>
                {isAnswered && i === correctAns && <CheckCircle2 className="ml-2 text-emerald-500" />}
                {isAnswered && i === selectedIdx && i !== correctAns && <XCircle className="ml-2 text-rose-500" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HealthQuiz;
