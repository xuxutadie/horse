import React, { useState } from 'react';
import { GameState, Level, Question } from './types';
import { GAME_LEVELS } from './data';
import { GameScreen } from './components/GameScreen';
import { MarioGame } from './components/MarioGame';
import { Trophy, Stethoscope, BookOpen, AlertCircle, ShieldCheck, CheckCircle, Play, RotateCcw, Activity, ArrowRight, Skull } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [gameMode, setGameMode] = useState<'classic' | 'mario'>('mario');
  
  // Classic Mode State
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  const currentLevel: Level = GAME_LEVELS[currentLevelIndex];
  const currentQuestion: Question = currentLevel.questions[currentQuestionIndex];

  const handleStartGame = (mode: 'classic' | 'mario') => {
    setGameMode(mode);
    setScore(0);
    if (mode === 'classic') {
      setGameState(GameState.LEVEL_TRANSITION);
    } else {
      setGameState(GameState.PLAYING);
    }
  };

  const handleStartLevel = () => {
    setGameState(GameState.PLAYING);
  };

  const handleSelectOption = (optionId: string) => {
    setSelectedOption(optionId);
    setShowFeedback(true);
    if (optionId === currentQuestion.correctAnswer) {
      setScore(s => s + 10);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setShowFeedback(false);

    if (currentQuestionIndex < currentLevel.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      if (currentLevelIndex < GAME_LEVELS.length - 1) {
        setCurrentLevelIndex(prev => prev + 1);
        setCurrentQuestionIndex(0);
        setGameState(GameState.LEVEL_TRANSITION);
      } else {
        setGameState(GameState.COMPLETED);
      }
    }
  };

  const handleRestart = () => {
    setGameState(GameState.START);
    setCurrentLevelIndex(0);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setShowFeedback(false);
  };

  // --- 1. Start Screen ---
  if (gameState === GameState.START) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-600/30 rounded-full blur-[120px] animate-pulse mix-blend-screen"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-sky-500/20 rounded-full blur-[100px] mix-blend-screen"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        </div>

        <div className="relative z-10 max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left space-y-8 fade-in">
               {/* Mobile Image (Horse Head) */}
               <div className="md:hidden flex justify-center mb-4">
                  <div className="relative w-48 h-48 bg-gradient-to-tr from-slate-800 to-slate-900 rounded-[2rem] rotate-3 shadow-2xl flex items-center justify-center border border-slate-700/50 backdrop-blur-sm overflow-hidden">
                    <img 
                      src="/FM.png" 
                      alt="Game Cover" 
                      className="w-full h-full object-cover"
                    />
                  </div>
               </div>

               <div className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 backdrop-blur-md border border-slate-700 text-sky-400 text-sm font-bold uppercase tracking-widest shadow-lg">
                  <Activity className="w-4 h-4" /> 医疗专业培训
               </div>
               
               <div className="space-y-4">
                 <h1 className="text-7xl md:text-9xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400">马力全开</span>
                </h1>
               </div>

               <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-lg mx-auto md:mx-0 font-light border-l-4 border-sky-500/50 pl-6">
                  沉浸式情景模拟，全方位提升您的<strong className="text-white font-medium">同理心</strong>、<strong className="text-white font-medium">医患沟通</strong>及<strong className="text-white font-medium">纠纷处置</strong>能力。
               </p>

               <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <button 
                    onClick={() => handleStartGame('mario')}
                    className="group relative bg-yellow-500 hover:bg-yellow-400 text-yellow-950 text-xl font-bold px-8 py-5 rounded-2xl shadow-[0_0_40px_-10px_rgba(234,179,8,0.6)] transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    冒险模式 <Play className="w-6 h-6 fill-current" />
                  </button>
                  <button 
                    onClick={() => handleStartGame('classic')}
                    className="group relative bg-slate-700 hover:bg-slate-600 text-white text-xl font-bold px-8 py-5 rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3"
                  >
                    经典模式 <BookOpen className="w-6 h-6" />
                  </button>
               </div>
            </div>

            <div className="hidden md:flex justify-center relative fade-in delay-100">
               <div className="relative w-80 h-80 bg-gradient-to-tr from-slate-800 to-slate-900 rounded-[3rem] rotate-6 shadow-2xl flex items-center justify-center border border-slate-700/50 backdrop-blur-sm z-10 group hover:rotate-0 transition-all duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-sky-500/10 rounded-[3rem] blur-xl group-hover:bg-sky-500/20 transition-all"></div>
                  <img 
                    src="/FM.png" 
                    alt="Game Cover" 
                    className="w-full h-full object-cover rounded-[3rem] transform transition-transform duration-500 group-hover:scale-110"
                  />
               </div>
            </div>
        </div>
      </div>
    );
  }

  // --- Game Over Screen ---
  if (gameState === GameState.GAME_OVER) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="text-center space-y-8 fade-in relative z-10">
          <div className="inline-block p-6 rounded-full bg-red-500/20 border-4 border-red-500 mb-4 animate-bounce">
             <Skull className="w-20 h-20 text-red-500" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight drop-shadow-red">
            挑战失败
          </h1>
          <p className="text-xl text-slate-400 max-w-md mx-auto">
            很遗憾，您在模拟过程中出现了失误。请总结经验，重新开始。
          </p>
          <button 
            onClick={handleRestart}
            className="bg-red-600 hover:bg-red-500 text-white text-xl font-bold px-12 py-5 rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 mx-auto"
          >
            <RotateCcw className="w-6 h-6" /> 重新开始
          </button>
        </div>
      </div>
    );
  }

  // --- Mario Mode ---
  if (gameState === GameState.PLAYING && gameMode === 'mario') {
    return (
      <MarioGame 
        onGameComplete={(finalScore) => {
           setScore(finalScore);
           setGameState(GameState.COMPLETED);
        }}
        onGameOver={() => {
           setGameState(GameState.GAME_OVER);
        }}
      />
    );
  }

  // --- Classic Mode: Level Transition ---
  if (gameState === GameState.LEVEL_TRANSITION) {
    const icons = [
      <BookOpen className="w-16 h-16 md:w-24 md:h-24 text-white" />,
      <AlertCircle className="w-16 h-16 md:w-24 md:h-24 text-white" />,
      <ShieldCheck className="w-16 h-16 md:w-24 md:h-24 text-white" />,
      <CheckCircle className="w-16 h-16 md:w-24 md:h-24 text-white" />
    ];

    return (
      <div className="min-h-screen bg-[#0b1121] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="relative z-10 max-w-5xl w-full">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 shadow-2xl fade-in">
            <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center relative z-10 shadow-2xl">
              <div className="bg-gradient-to-br from-sky-400 to-blue-600 w-32 h-32 md:w-44 md:h-44 rounded-full flex items-center justify-center shadow-inner">
                {icons[currentLevelIndex] || icons[0]}
              </div>
            </div>
            <div className="flex-1 text-center md:text-left space-y-6">
              <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-md">{currentLevel.title}</h1>
              <p className="text-xl md:text-2xl text-slate-300 font-light leading-relaxed max-w-2xl">
                {currentLevel.description}
              </p>
              <div className="pt-8 flex justify-center md:justify-start">
                <button 
                  onClick={handleStartLevel}
                  className="group bg-white text-slate-900 hover:bg-sky-50 text-xl font-bold px-12 py-5 rounded-full shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                >
                  进入关卡 <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Completion Screen ---
  if (gameState === GameState.COMPLETED) {
    // Calc max score logic (might differ for mario mode if we skip questions, but for now assume full run)
    const totalQuestions = GAME_LEVELS.reduce((acc, level) => acc + level.questions.length, 0);
    const maxScore = totalQuestions * 10;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    let title = "医疗新星";
    let titleColor = "text-blue-600 bg-blue-50 border-blue-200";
    if (percentage === 100) {
      title = "沟通大师";
      titleColor = "text-yellow-600 bg-yellow-50 border-yellow-200";
    } else if (percentage >= 80) {
      title = "金牌医师";
      titleColor = "text-purple-600 bg-purple-50 border-purple-200";
    } else if (percentage >= 60) {
      title = "潜力实习生";
      titleColor = "text-sky-600 bg-sky-50 border-sky-200";
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative">
        <div className="bg-white rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] p-8 md:p-16 max-w-2xl w-full text-center fade-in relative z-10 border border-slate-100 mt-10">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2">
             <div className="relative">
               <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-40 animate-pulse"></div>
               <div className="bg-gradient-to-br from-yellow-100 to-amber-50 p-6 rounded-full border-4 border-white shadow-xl">
                 <Trophy className="w-20 h-20 text-yellow-500 drop-shadow-md" />
               </div>
             </div>
          </div>
          
          <div className="mt-12">
            <h1 className="text-3xl md:text-5xl font-black text-slate-800 mb-4">挑战完成!</h1>
            <p className="text-xl text-slate-500 mb-10 font-light">恭喜您完成了模拟训练。</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">最终得分</div>
                <div className="text-5xl font-black text-slate-800 flex items-baseline justify-center gap-1">
                  {score}<span className="text-lg text-slate-400 font-medium">/ {maxScore}</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-center items-center">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">获得称号</div>
                <div className={`px-4 py-2 rounded-full text-lg font-bold border ${titleColor} flex items-center gap-2`}>
                  <ShieldCheck className="w-5 h-5" /> {title}
                </div>
              </div>
            </div>

            <button 
              onClick={handleRestart}
              className="w-full bg-slate-900 hover:bg-black text-white text-xl font-bold py-5 rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
            >
              <RotateCcw className="w-6 h-6" /> 重新挑战
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Classic Mode: Game Screen ---
  return (
    <GameScreen
      levelTitle={currentLevel.title}
      currentQuestionIndex={currentQuestionIndex}
      totalQuestions={currentLevel.questions.length}
      question={currentQuestion}
      selectedOption={selectedOption}
      onSelectOption={handleSelectOption}
      showFeedback={showFeedback}
      onNext={handleNext}
    />
  );
};

export default App;
