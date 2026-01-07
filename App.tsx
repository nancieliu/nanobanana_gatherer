
import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  const [showDebug, setShowDebug] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), []);

  // Detect if we are in AI Studio
  // @ts-ignore
  const isAiStudio = !!(window.aistudio && typeof window.aistudio.openSelectKey === 'function');

  const keySuffix = useMemo(() => {
    try {
      // @ts-ignore
      const key = process.env.API_KEY || '';
      return key.length > 4 ? `...${key.slice(-4)}` : 'MISSING';
    } catch (e) {
      return 'ERROR';
    }
  }, [isLoading, modelTier, error]);

  const handleSelectProKey = async () => {
    setModalError(null);
    // @ts-ignore
    const aiStudio = window.aistudio;
    
    if (aiStudio && typeof aiStudio.openSelectKey === 'function') {
      try {
        console.log("Gatherer.AI: Opening Dialog...");
        await aiStudio.openSelectKey();
        
        // Guidelines: Assume success and proceed
        setShowProSelector(false);
        setModelTier('gemini-3-pro-image-preview');
        setError(null);
      } catch (err: any) {
        setModalError("Could not open the key selector. Please refresh and try again.");
      }
    } else {
      setModalError("Key selection is only available when running inside Google AI Studio. If you are on Vercel, you must update the API_KEY in Vercel Settings.");
    }
  };

  const changeModel = async (model: ImageModel) => {
    if (model === 'gemini-3-pro-image-preview') {
      // @ts-ignore
      const aiStudio = window.aistudio;
      const hasSelected = aiStudio && typeof aiStudio.hasSelectedApiKey === 'function' 
        ? await aiStudio.hasSelectedApiKey() 
        : false;
      
      if (!hasSelected) {
        setModalError(null);
        setShowProSelector(true);
        return;
      }
    }
    setModelTier(model);
    setError(null);
  };

  const handleGenerate = useCallback(async () => {
    if (!sourceFile) {
      setError({ message: 'Please upload a screenshot first.' });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setLoadingStep('Initializing...');
      const imageData = await fileToBase64(sourceFile);
      
      const selectedBg = BACKGROUND_OPTIONS.find(bg => bg.id === selectedBackgroundId);
      const style = STYLE_VARIATIONS[generatedImages.length % STYLE_VARIATIONS.length];
      const finalPrompt = `${selectedBg?.prompt || ''}. ${userPrompt}`;
      
      setLoadingStep(`Generating with ${modelTier === 'gemini-3-pro-image-preview' ? 'Pro' : 'Flash'}...`);
      
      const base64Image = await generateGatheringImageVariation(
        imageData, 
        finalPrompt, 
        style, 
        { model: modelTier, resolution, aspectRatio }
      );
      
      setLoadingStep(`Finalizing...`);
      const stamped = await addDateFooter(base64Image, todayStr);
      setGeneratedImages(prev => [`data:image/jpeg;base64,${stamped}`, ...prev]);

    } catch (err: any) {
      console.error("Gatherer.AI: API Error", err);
      const errStr = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
      
      let msg = err.message || "An unexpected error occurred.";
      let isQuota = false;

      if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('limit":0') || errStr.toLowerCase().includes('quota')) {
        isQuota = true;
        msg = "QUOTA EXCEEDED: Your API Key has 0 image generation quota. This usually means the Google Cloud project needs billing enabled.";
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 overflow-y-auto">
          <div className="max-w-md w-full bg-[#0a0a0a] border border-gray-800 rounded-[2.5rem] p-10 text-center space-y-8 shadow-2xl border-t-yellow-500/30 my-auto">
            <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-yellow-500/20">
              <SparkleIcon className="w-10 h-10 text-yellow-500" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-white">Project Switch</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your current project (Ending in <strong>{keySuffix}</strong>) has no image quota. Select a key from a <strong>Paid Project</strong> to continue.
              </p>
            </div>

            {modalError && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-[11px] text-red-400 font-bold leading-relaxed text-left animate-in fade-in slide-in-from-top-2">
                ⚠️ {modalError}
              </div>
            )}

            <div className="space-y-4">
              <button 
                onClick={handleSelectProKey} 
                className="w-full py-5 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl transition-all shadow-xl shadow-yellow-500/20 active:scale-95"
              >
                SELECT API KEY
              </button>
              
              <div className="flex flex-col gap-4">
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                  Billing Documentation ↗
                </a>
                <button 
                  onClick={() => { setShowProSelector(false); setModelTier('gemini-2.5-flash-image'); setModalError(null); }} 
                  className="text-gray-700 hover:text-white font-bold transition-all text-[10px] tracking-widest uppercase"
                >
                  Cancel and Stay Basic
                </button>
              </div>
            </div>
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
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Active Key: <span className="text-gray-400 font-mono">{keySuffix}</span></span>
              {!isAiStudio && <span className="text-[7px] font-black text-red-500/50 uppercase tracking-widest">STANDALONE MODE</span>}
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
                  <span className="text-[9px] font-black text-gray-700 block mb-2 tracking-widest uppercase">Aspect</span>
                  <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="bg-transparent w-full text-sm font-black outline-none cursor-pointer text-white">
                    {ASPECT_RATIOS.map(a => <option key={a} value={a} className="bg-gray-900">{a}</option>)}
                  </select>
               </div>
               <div className={`bg-gray-950 rounded-2xl p-4 border border-gray-900 transition-opacity ${modelTier === 'gemini-2.5-flash-image' ? 'opacity-20 pointer-events-none' : ''}`}>
                  <span className="text-[9px] font-black text-gray-700 block mb-2 tracking-widest uppercase">Quality</span>
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
          <div className="bg-[#030303] rounded-[3rem] border border-gray-900/50 p-8 min-h-[650px] flex flex-col relative shadow-inner overflow-hidden">
            {error && (
              <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-[2rem] mb-10 animate-in slide-in-from-top-10 duration-500">
                <div className="flex items-start gap-5">
                  <div className="bg-red-500/10 p-3 rounded-2xl shrink-0">🚨</div>
                  <div className="space-y-4 w-full">
                    <h3 className="text-red-500 font-black uppercase text-xs tracking-[0.2em]">Billing Alert</h3>
                    <p className="text-red-200/60 text-sm leading-relaxed font-medium">{error.message}</p>
                    
                    {error.isQuota && (
                      <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-2xl space-y-6">
                        <p className="text-[11px] text-red-200/40 font-bold uppercase tracking-widest">Recommended Action:</p>
                        <ul className="text-[11px] text-red-200/80 space-y-4 list-none font-medium">
                          <li className="flex gap-4 items-center">
                            <span className="bg-yellow-500 text-black w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">1</span> 
                            <span>Switch to a <strong>Paid Project</strong> using the PRO button in the header.</span>
                          </li>
                          <li className="flex gap-4 items-center">
                            <span className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">2</span> 
                            <span>Ensure project <strong>{keySuffix}</strong> has billing enabled in GCP.</span>
                          </li>
                        </ul>
                        <div className="pt-2 flex flex-col gap-3">
                           <button onClick={() => changeModel('gemini-3-pro-image-preview')} className="w-full py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all">Select Different API Key</button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4">
                      <button onClick={() => setError(null)} className="px-6 py-2 bg-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors">Dismiss</button>
                      <button onClick={() => setShowDebug(!showDebug)} className="text-[9px] text-gray-600 font-bold uppercase underline">Show Error Stack</button>
                    </div>

                    {showDebug && (
                      <pre className="mt-4 p-4 bg-black border border-gray-800 rounded-xl text-[10px] overflow-auto max-h-40 text-gray-500 font-mono">
                        {error.raw}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!isLoading && generatedImages.length === 0 && !error && (
              <div className="flex-grow flex flex-col items-center justify-center text-gray-900">
                <SparkleIcon className="w-32 h-32 mb-8 opacity-[0.05]" />
                <p className="text-center font-black text-xs uppercase tracking-[0.5em] opacity-20">Awaiting Capture</p>
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
                  <p className="text-gray-700 text-[9px] font-black uppercase tracking-widest font-mono">Key Suffix: {keySuffix}</p>
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
            {todayStr} • Gatherer AI Engine v0.9
          </div>
          <div className="flex gap-8 text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="hover:text-gray-400 transition-colors">Billing Documentation</a>
            <span className="text-yellow-500/10 tracking-tighter uppercase">Flash Image 2.5 Native</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
