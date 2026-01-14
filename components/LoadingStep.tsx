import React from 'react';
import { Loader2, Search, Palette, Layers, CheckCircle, Sparkles, Brain, Wand2 } from 'lucide-react';
import { AppState } from '../types';

interface LoadingStepProps {
  currentStep: AppState;
}

const LoadingStep: React.FC<LoadingStepProps> = ({ currentStep }) => {
  const steps = [
    { 
      id: AppState.ANALYZING, 
      label: 'Analyzing Product', 
      description: 'AI is researching your product and writing conversion copy',
      icon: Brain 
    },
    { 
      id: AppState.GENERATING_IMAGE, 
      label: 'Creating Visuals', 
      description: 'Generating a stunning background that matches the mood',
      icon: Wand2 
    },
    { 
      id: AppState.COMPOSITING, 
      label: 'Finalizing Design', 
      description: 'Compositing everything into your final promo',
      icon: Layers 
    },
  ];

  const getStatus = (stepId: AppState) => {
    const stepOrder = [AppState.IDLE, AppState.ANALYZING, AppState.GENERATING_IMAGE, AppState.COMPOSITING, AppState.COMPLETE];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);
    
    if (currentStep === stepId) return 'active';
    if (currentIndex > stepIndex) return 'completed';
    return 'pending';
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 my-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 rounded-full border border-indigo-500/30">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-indigo-300 font-medium">AI Magic in Progress</span>
        </div>
        <p className="text-slate-400 text-sm">This usually takes 10-15 seconds</p>
      </div>
      
      {/* Steps */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 space-y-1">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const status = getStatus(step.id);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id}>
              <div className="flex items-start gap-4 py-3">
                {/* Icon */}
                <div className={`
                  relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                  ${status === 'active' 
                    ? 'bg-indigo-500/20 border-2 border-indigo-500' 
                    : status === 'completed' 
                      ? 'bg-green-500/20 border-2 border-green-500' 
                      : 'bg-slate-800 border-2 border-slate-700'}
                `}>
                  {status === 'active' ? (
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                  ) : status === 'completed' ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <Icon className="w-6 h-6 text-slate-500" />
                  )}
                  
                  {/* Glow effect for active */}
                  {status === 'active' && (
                    <div className="absolute inset-0 rounded-xl bg-indigo-500/20 animate-ping" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className={`font-bold ${
                    status === 'active' 
                      ? 'text-white' 
                      : status === 'completed' 
                        ? 'text-slate-300' 
                        : 'text-slate-500'
                  }`}>
                    {step.label}
                  </h4>
                  <p className={`text-sm mt-0.5 ${
                    status === 'active' 
                      ? 'text-slate-400' 
                      : status === 'completed' 
                        ? 'text-slate-500' 
                        : 'text-slate-600'
                  }`}>
                    {status === 'completed' ? 'Done!' : step.description}
                  </p>
                </div>
                
                {/* Status Badge */}
                <div className="flex-shrink-0">
                  {status === 'active' && (
                    <span className="px-2 py-1 text-xs font-bold bg-indigo-500/20 text-indigo-400 rounded">
                      Working...
                    </span>
                  )}
                  {status === 'completed' && (
                    <span className="px-2 py-1 text-xs font-bold bg-green-500/20 text-green-400 rounded">
                      ✓
                    </span>
                  )}
                </div>
              </div>
              
              {/* Connector Line */}
              {!isLast && (
                <div className="ml-6 w-px h-4 bg-slate-700" />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Fun Fact */}
      <div className="text-center text-slate-500 text-xs">
        💡 Pro tip: The AI uses psychology principles to write copy that converts
      </div>
    </div>
  );
};

export default LoadingStep;
