import React, { useEffect, useRef } from 'react';
import { Question, Option } from '../types';
import { CheckCircle2, XCircle, ArrowRight, BookOpen, AlertCircle, HelpCircle } from 'lucide-react';

interface GameScreenProps {
  levelTitle: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  question: Question;
  selectedOption: string | null;
  onSelectOption: (optionId: string) => void;
  showFeedback: boolean;
  onNext: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  levelTitle,
  currentQuestionIndex,
  totalQuestions,
  question,
  selectedOption,
  onSelectOption,
  showFeedback,
  onNext,
}) => {
  const isCorrect = selectedOption === question.correctAnswer;
  const feedbackRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to feedback on mobile, or just focus slightly
  useEffect(() => {
    if (showFeedback && feedbackRef.current) {
      // Small delay to allow render
      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [showFeedback]);

  // Scroll to top when question changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [question]);

  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-slate-800 font-sans selection:bg-sky-200 flex flex-col">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-sky-200/40 to-transparent"></div>
        <div className="absolute -top-[10%] -right-[10%] w-[60vw] h-[60vw] bg-blue-300/20 rounded-full blur-[100px]"></div>
        <div className="absolute top-[40%] -left-[10%] w-[50vw] h-[50vw] bg-indigo-300/20 rounded-full blur-[100px]"></div>
      </div>

      {/* Header Bar */}
      <div ref={topRef} className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-sky-500 to-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-sky-200 ring-2 ring-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">当前关卡</h2>
                <h1 className="text-base md:text-lg font-extrabold text-slate-800 leading-tight">{levelTitle}</h1>
              </div>
            </div>

            {/* Progress Section */}
            <div className="flex items-center gap-4 min-w-[240px] bg-white/50 px-4 py-2 rounded-full border border-slate-100 shadow-sm">
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>挑战进度</span>
                  <span className="text-sky-600">{currentQuestionIndex + 1} / {totalQuestions}</span>
                </div>
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 rounded-full transition-all duration-700 ease-out relative"
                    style={{ width: `${progressPercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Pushed down for better vertical positioning */}
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:pt-48 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          
          {/* LEFT COLUMN: Scenario & Question */}
          <div className="lg:col-span-7 lg:sticky lg:top-48 transition-all duration-500">
            <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border-2 border-slate-100 p-8 md:p-16 relative overflow-hidden group hover:shadow-[0_30px_70px_-15px_rgba(14,165,233,0.15)] transition-shadow duration-500">
              
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-sky-50 rounded-bl-[100px] -mr-12 -mt-12 transition-transform group-hover:scale-110 duration-700"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-50/50 rounded-tr-[80px] -ml-8 -mb-8 pointer-events-none"></div>

              <div className="relative z-10">
                {question.scenario && (
                  <div className="mb-14">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-sm font-black uppercase tracking-wide mb-8 shadow-sm">
                      <AlertCircle className="w-4 h-4" /> 
                      <span>情景模拟</span>
                    </div>
                    <p className="text-xl md:text-2xl text-slate-700 leading-[2] text-justify font-medium tracking-wide">
                      {question.scenario}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-6 items-start">
                  <div className="flex-shrink-0 pt-1">
                     <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-black text-3xl shadow-lg shadow-blue-200 transform group-hover:rotate-12 transition-transform duration-500">
                        Q
                     </div>
                  </div>
                  <h3 className="text-2xl md:text-4xl font-extrabold text-slate-800 leading-snug tracking-tight">
                    {question.question}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Options & Feedback */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            
            {/* Options List */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 mb-1 px-1">
                 <div className="bg-slate-200 p-1 rounded-full"><HelpCircle className="w-3.5 h-3.5 text-slate-500"/></div>
                 <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">请选择最佳答案</span>
              </div>
              
              {question.options.map((option: Option) => {
                const isSelected = selectedOption === option.id;
                const isCorrectOption = option.id === question.correctAnswer;
                
                // Base styles
                let containerClass = "relative p-6 rounded-3xl border-2 transition-all duration-300 cursor-pointer flex items-start gap-5 group/option ";
                let idClass = "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base transition-all duration-300 border shadow-sm ";

                if (showFeedback) {
                  containerClass += "cursor-default ";
                  
                  if (isSelected) {
                    if (isCorrect) {
                      // Correct & Selected
                      containerClass += "bg-emerald-50 border-emerald-500 shadow-xl shadow-emerald-100 scale-[1.03] z-10 ring-4 ring-emerald-100 ring-offset-2";
                      idClass += "bg-emerald-500 border-emerald-500 text-white";
                    } else {
                      // Incorrect & Selected
                      containerClass += "bg-red-50 border-red-500 shadow-xl shadow-red-100 scale-[1.03] z-10 ring-4 ring-red-100 ring-offset-2";
                      idClass += "bg-red-500 border-red-500 text-white";
                    }
                  } else if (isCorrectOption) {
                    // Correct & Not Selected
                    containerClass += "bg-emerald-50/60 border-emerald-400 border-dashed opacity-100 ring-2 ring-emerald-100 ring-offset-1";
                    idClass += "bg-emerald-500 border-emerald-500 text-white shadow-md";
                  } else {
                    // Others (Dimmed)
                    containerClass += "bg-slate-50 border-slate-100 opacity-50 grayscale";
                    idClass += "bg-slate-200 border-slate-200 text-slate-400";
                  }
                } else {
                  // Interactive State
                  if (isSelected) {
                    containerClass += "bg-sky-50 border-sky-500 shadow-xl shadow-sky-100 scale-[1.02] z-10 ring-4 ring-sky-100 ring-offset-2";
                    idClass += "bg-sky-500 border-sky-500 text-white";
                  } else {
                    containerClass += "bg-white border-slate-200 shadow-sm hover:border-sky-400 hover:shadow-lg hover:shadow-sky-100/50 hover:-translate-y-1";
                    idClass += "bg-slate-50 border-slate-200 text-slate-500 group-hover/option:bg-sky-100 group-hover/option:text-sky-600 group-hover/option:border-sky-200";
                  }
                }

                return (
                  <div 
                    key={option.id}
                    onClick={() => !showFeedback && onSelectOption(option.id)}
                    className={containerClass}
                  >
                    <div className={idClass}>{option.id}</div>
                    <p className={`text-lg md:text-xl leading-relaxed ${showFeedback && isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-600 group-hover/option:text-slate-900'}`}>
                      {option.text}
                    </p>
                    
                    {/* Status Icon */}
                    {showFeedback && isSelected && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow-md">
                         {isCorrect ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Feedback / Action Area */}
            {showFeedback && (
              <div ref={feedbackRef} className="animate-in slide-in-from-bottom-6 duration-500 fade-in">
                <div className={`rounded-[2rem] p-8 md:p-10 border-2 shadow-2xl relative overflow-hidden ${isCorrect ? 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200 shadow-emerald-100' : 'bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200 shadow-orange-100'}`}>
                   
                   {/* Background Decor */}
                   <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-50 ${isCorrect ? 'bg-emerald-200/30' : 'bg-orange-200/30'}`}></div>

                   {/* Feedback Content */}
                   <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-6">
                        <div className={`p-2 rounded-xl ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>
                          {isCorrect ? <CheckCircle2 className="w-6 h-6"/> : <AlertCircle className="w-6 h-6"/>}
                        </div>
                        <h4 className={`font-black text-2xl ${isCorrect ? 'text-emerald-900' : 'text-orange-900'}`}>
                           {isCorrect ? '回答正确！' : '回答错误'}
                        </h4>
                     </div>
                     
                     <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">专业解析</span>
                       <div className="text-slate-800 text-lg leading-relaxed whitespace-pre-line font-medium">
                         {question.analysis}
                       </div>
                     </div>
                   </div>
                </div>
                
                <button 
                  onClick={onNext}
                  className="mt-8 w-full bg-slate-900 hover:bg-black text-white text-xl font-bold py-6 rounded-2xl shadow-2xl shadow-slate-400/30 transition-all transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-3 group"
                >
                  <span>{isCorrect ? '进入下一题' : '继续挑战'}</span>
                  <div className="bg-white/20 p-1.5 rounded-full group-hover:translate-x-1 transition-transform">
                     <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};