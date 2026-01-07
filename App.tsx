import React, { useState, useCallback } from 'react';
import { generateGatheringImageVariation } from './services/geminiService';
import { fileToBase64, addDateFooter } from './utils/imageUtils';
import { BACKGROUND_OPTIONS, STYLE_VARIATIONS, RESOLUTIONS, ASPECT_RATIOS } from './constants';
import { ImageResolution, AspectRatio, ImageModel } from './types';
import { SparkleIcon } from './components/IconComponents';
import ImageUploader from './components/ImageUploader';
import BackgroundSelector from './components/BackgroundSelector';
import PromptInput from './components/PromptInput';

const App: React.FC = () => {
  const [showProSelector, setShowProSelector] = useState(false);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string>(BACKGROUND_OPTIONS[0].id);
  const [modelTier, setModelTier] = useState<ImageModel>('gemini-2.5-flash-image');
  const [resolution, setResolution] = useState<ImageResolution>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<any>(null);

  const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleSelectProKey = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setShowProSelector(false);
      setModelTier('gemini-3-pro-image-preview');
    } else {
      setError({ message: "Key selection is only available inside the AI Studio environment." });
    }
  };

  const changeModel = async (model: ImageModel) => {
    if (model === 'gemini-3-pro-image-preview') {
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setShowProSelector(true);
          return;
        }
      } else {
        setShowProSelector(true);
        return;
      }
    }
    setModelTier(model);
  };

  const handleGenerate = useCallback(async () => {
    if (!sourceFile) {
      setError({ message: 'Please upload a screenshot first.' });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setLoadingStep('Optimizing image tokens...');
      const imageData = await fileToBase64(sourceFile);
      
      const selectedBg = BACKGROUND_OPTIONS.find(bg => bg.id === selectedBackgroundId);
      const finalPrompt = `${selectedBg?.prompt || ''}. ${userPrompt}`;
      
      setLoadingStep(`Contacting Gemini ${modelTier === 'gemini-3-pro-image-preview' ? 'Pro' : 'Flash'}...`);
      const style = STYLE_VARIATIONS[generatedImages.length % STYLE_VARIATIONS.length];
      
      const base64Image = await generateGatheringImageVariation(
        imageData, 
        finalPrompt, 
        style, 
        { model: modelTier, resolution, aspectRatio }
      );
      
      setLoadingStep(`Finalizing memory...`);
      const stamped = await addDateFooter(base64Image, todayStr);
      setGeneratedImages(prev => [`data:image/jpeg;base64,${stamped}`, ...prev]);

    } catch (err: any) {
      console.error("API Error Trace:", err);
      const errStr = JSON.stringify(err);
      
      let msg = err.message || "An unexpected error occurred.";
      let isQuota = false;

      if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('limit":0')) {
        isQuota = true;
        msg = "QUOTA EXHAUSTED: Your 'Default Gemini Project' has reached its limit. To fix this, create a NEW project in AI Studio and generate a fresh API key.";
      }

      setError({ message: msg, isQuota, raw: errStr });
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  }, [sourceFile, selectedBackgroundId, userPrompt, modelTier, resolution, aspectRatio, todayStr, generatedImages.length]);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 flex flex-col antialiased">
      {showProSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
          <div className="max-w-md w-full bg-[#0a0a0a] border border-gray-800 rounded-[2.5rem] p-10 text-center space-y-8 shadow-2xl border-t-yellow-500/30">
            <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-yellow-500/20">
              <SparkleIcon className="w-10 h-10 text-yellow-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white">Upgrade Quota</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                The "Default Gemini Project" is heavily restricted. By selecting your own paid API key, you get higher limits and professional-grade generation.
              </p>
            </div>
            <div className="space-y-4 pt-4">
              <button 
                onClick={handleSelectProKey} 
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl transition-all shadow-xl shadow-yellow-500/20 active:scale-95"
              >
                SELECT API KEY
              </button>
              <button 
                onClick={() => { setShowProSelector(false); setModelTier('gemini-2.5-flash-image'); }} 
                className="w-full py-3 text-gray-500 hover:text-white font-bold transition-all text-xs tracking-widest"
              >
                STAY ON FREE TIER
              </button>
            </div>
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
              Requires a project with Billing Enabled
            </p>
          </div>
        </div>
      )}

      <header className="bg-black/50 backdrop-blur-md border-b border-gray-900/50 p-5 sticky top-0 z-20">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/10">
              <SparkleIcon className="text-black w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter">GATHERER<span className="text-yellow-500">.AI</span></h1>
          </div>
          <div className="flex bg-gray-900/80 rounded-2xl p-1 border border-gray-800">
            <button 
              onClick={() => changeModel('gemini-2.5-flash-image')} 
              className={`px-5 py-2 text-[10px] font-black rounded-xl transition-all tracking-widest ${modelTier === 'gemini-2.5-flash-image' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/10' : 'text-gray-500 hover:text-gray-300'}`}
            >
              FLASH
            </button>
            <button 
              onClick={() => changeModel('gemini-3-pro-image-preview')} 
              className={`px-5 py-2 text-[10px] font-black rounded-xl transition-all tracking-widest ${modelTier === 'gemini-3-pro-image-preview' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/10' : 'text-gray-500 hover:text-gray-300'}`}
            >
              PRO
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto p-4 md:p-10 max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-4 space-y-8">
          <div className="bg-[#0a0a0a] rounded-[2.5rem] p-8 border border-gray-900 shadow-2xl space-y-8">
            <section>
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4 block">1. Input Image</label>
              <ImageUploader onFileSelect={setSourceFile} />
            </section>

            <section>
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4 block">2. Environment</label>
              <BackgroundSelector options={BACKGROUND_OPTIONS} selectedId={selectedBackgroundId} onSelect={setSelectedBackgroundId} />
            </section>

            <section>
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4 block">3. Adjustments</label>
              <PromptInput value={userPrompt} onChange={setUserPrompt} />
            </section>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-gray-950 rounded-2xl p-4 border border-gray-900">
                  <span className="text-[9px] font-black text-gray-700 block mb-2 tracking-widest">ASPECT</span>
                  <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="bg-transparent w-full text-sm font-black outline-none cursor-pointer text-white">
                    {ASPECT_RATIOS.map(a => <option key={a} value={a} className="bg-gray-900">{a}</option>)}
                  </select>
               </div>
               <div className={`bg-gray-950 rounded-2xl p-4 border border-gray-900 transition-opacity ${modelTier === 'gemini-2.5-flash-image' ? 'opacity-20 pointer-events-none' : ''}`}>
                  <span className="text-[9px] font-black text-gray-700 block mb-2 tracking-widest">QUALITY</span>
                  <select disabled={modelTier === 'gemini-2.5-flash-image'} value={resolution} onChange={(e) => setResolution(e.target.value as ImageResolution)} className="bg-transparent w-full text-sm font-black outline-none cursor-pointer text-white">
                    {RESOLUTIONS.map(r => <option key={r} value={r} className="bg-gray-900">{r}</option>)}
                  </select>
               </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || !sourceFile}
              className="w-full py-5 bg-yellow-500 text-black font-black rounded-[1.25rem] hover:bg-yellow-400 transition-all disabled:opacity-20 shadow-2xl shadow-yellow-500/10 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                   <div className="w-5 h-5 border-3 border-black/20 border-t-black rounded-full animate-spin"></div>
                   <span className="tracking-widest text-xs uppercase">{loadingStep}</span>
                </div>
              ) : (
                <span className="tracking-widest text-xs uppercase">GENERATE MEMORY</span>
              )}
            </button>
          </div>
        </aside>

        <section className="lg:col-span-8">
          <div className="bg-[#030303] rounded-[3rem] border border-gray-900/50 p-8 min-h-[650px] flex flex-col relative shadow-inner">
            {error && (
              <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-[2rem] mb-10 animate-in slide-in-from-top-10 duration-500">
                <div className="flex items-start gap-5">
                  <div className="bg-red-500/10 p-3 rounded-2xl">🚨</div>
                  <div className="space-y-4">
                    <h3 className="text-red-500 font-black uppercase text-xs tracking-[0.2em]">Quota Exception Detected</h3>
                    <p className="text-red-200/60 text-sm leading-relaxed font-medium">{error.message}</p>
                    
                    {error.isQuota && (
                      <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-2xl space-y-5">
                        <p className="text-[11px] text-red-200/40 font-bold uppercase tracking-widest">Diagnostic Report:</p>
                        <ul className="text-[11px] text-red-200/80 space-y-3 list-none font-medium">
                          <li className="flex gap-2"><span>1.</span> <span>Go to <strong>ai.google.dev</strong></span></li>
                          <li className="flex gap-2"><span>2.</span> <span>Click Project Dropdown &rarr; <strong>New Project</strong></span></li>
                          <li className="flex gap-2"><span>3.</span> <span>Get a <strong>New API Key</strong> for that project</span></li>
                          <li className="flex gap-2"><span>4.</span> <span>Update your <strong>Vercel Env Variables</strong></span></li>
                        </ul>
                      </div>
                    )}
                    
                    <button onClick={() => setError(null)} className="px-6 py-2 bg-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors">Dismiss</button>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && generatedImages.length === 0 && !error && (
              <div className="flex-grow flex flex-col items-center justify-center text-gray-900">
                <SparkleIcon className="w-32 h-32 mb-8 opacity-[0.05]" />
                <p className="text-center font-black text-xs uppercase tracking-[0.5em] opacity-20">Waiting for Capture</p>
              </div>
            )}

            {isLoading && (
              <div className="flex-grow flex flex-col items-center justify-center">
                <div className="relative mb-8">
                  <div className="w-32 h-32 border-2 border-yellow-500/5 rounded-full animate-ping"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-yellow-500/10 border-t-yellow-500 rounded-full animate-spin"></div>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-yellow-500 font-black text-xs uppercase tracking-[0.4em]">{loadingStep}</p>
                  <p className="text-gray-700 text-[9px] font-black uppercase tracking-widest">Processing via {modelTier.includes('pro') ? 'Gemini Pro' : 'Gemini Flash'}</p>
                </div>
              </div>
            )}

            {generatedImages.length > 0 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                {generatedImages.map((src, i) => (
                  <div key={i} className={`group relative bg-black rounded-[2.5rem] overflow-hidden border border-gray-900 shadow-2xl transition-all hover:scale-[1.01] ${i === 0 ? 'ring-1 ring-yellow-500/30' : ''}`}>
                    <img src={src} alt="Memory" className="w-full h-auto" />
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-6">
                       <a 
                         href={src} 
                         download={`gathering-memory-${i}.jpg`} 
                         className="px-10 py-4 bg-yellow-500 text-black font-black rounded-2xl text-[10px] tracking-[0.2em] uppercase hover:bg-yellow-400 transition-all active:scale-95 shadow-2xl shadow-yellow-500/20"
                       >
                         DOWNLOAD HIGH RES
                       </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      
      <footer className="p-10 border-t border-gray-900 bg-black/80">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] text-gray-700 font-black uppercase tracking-[0.3em]">
            {todayStr} • Gatherer Engine v0.5
          </div>
          <div className="flex gap-8 text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">
            <span className="hover:text-gray-400 cursor-pointer transition-colors">Documentation</span>
            <span className="text-yellow-500/30">Stable Diffusion Alternative</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;