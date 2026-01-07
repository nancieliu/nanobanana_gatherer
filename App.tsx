
import React, { useState, useCallback, useMemo } from 'react';
import { generateGatheringImageVariation } from './services/geminiService';
import { fileToBase64, addDateFooter } from './utils/imageUtils';
import { BACKGROUND_OPTIONS, TONE_OPTIONS, STYLE_VARIATIONS } from './constants';
import { ImageResolution, AspectRatio, ImageModel } from './types';
import { SparkleIcon } from './components/IconComponents';
import ImageUploader from './components/ImageUploader';
import BackgroundSelector from './components/BackgroundSelector';
import PromptInput from './components/PromptInput';

const App: React.FC = () => {
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string>(BACKGROUND_OPTIONS[0].id);
  const [selectedToneId, setSelectedToneId] = useState<string>(TONE_OPTIONS[0].id);
  const [modelTier, setModelTier] = useState<ImageModel>('gemini-2.5-flash-image');
  const [resolution, setResolution] = useState<ImageResolution>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<any>(null);

  const todayStr = useMemo(() => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), []);

  const keyDisplay = useMemo(() => {
    try {
      const key = (process.env.API_KEY || '').trim();
      if (!key || key === 'undefined' || key === '' || key === 'API_KEY') return 'NONE';
      return `...${key.slice(-4)}`;
    } catch (e) {
      return 'UNAVAILABLE';
    }
  }, []);

  const hasRealKey = useMemo(() => keyDisplay !== 'NONE' && keyDisplay !== 'UNAVAILABLE', [keyDisplay]);

  const handleGenerate = useCallback(async () => {
    if (!sourceFile) {
      setError({ message: 'Please upload a source image first.' });
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      setLoadingStep('Pre-processing Image...');
      const imageData = await fileToBase64(sourceFile);
      const selectedBg = BACKGROUND_OPTIONS.find(bg => bg.id === selectedBackgroundId);
      const selectedTone = TONE_OPTIONS.find(t => t.id === selectedToneId);
      const finalPrompt = `${selectedBg?.prompt || ''}. Tone/Mood: ${selectedTone?.prompt || ''}. ${userPrompt}`;
      
      setLoadingStep(`Running ${modelTier === 'gemini-3-pro-image-preview' ? 'Pro' : 'Flash'} Engine...`);
      const base64Image = await generateGatheringImageVariation(
        imageData, 
        finalPrompt, 
        selectedTone?.prompt || STYLE_VARIATIONS[0], 
        { model: modelTier, resolution, aspectRatio, tone: selectedToneId }
      );
      
      setLoadingStep(`Finalizing Metadata...`);
      const stamped = await addDateFooter(base64Image, todayStr);
      setGeneratedImages(prev => [`data:image/jpeg;base64,${stamped}`, ...prev]);
    } catch (err: any) {
      const isBilling = err.message === "BILLING_REQUIRED";
      const isMissing = err.message === "API_KEY_NOT_CONFIGURED";
      
      let msg = "Generation failed. Please check your connection.";
      if (isBilling) msg = "Your Google Cloud Project has '0 Quota'. You MUST click 'Activate Billing' in AI Studio (or GCP Console) to enable images.";
      if (isMissing) msg = "Vercel Environment Variable 'API_KEY' is missing. Please add it to your project settings.";
      
      setError({ message: msg, isBilling, isMissing, raw: err.raw || err.message });
      if (isBilling || isMissing) setShowTroubleshooter(true);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  }, [sourceFile, selectedBackgroundId, selectedToneId, userPrompt, modelTier, resolution, aspectRatio, todayStr]);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 flex flex-col antialiased">
      <header className="bg-black/80 backdrop-blur-3xl border-b border-white/5 p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <SparkleIcon className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter">GATHERER<span className="text-yellow-500">.AI</span></h1>
              <div className="flex items-center gap-2">
                 <div className={`w-1.5 h-1.5 rounded-full ${hasRealKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                 <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">
                   {hasRealKey ? 'Secure Session' : 'Configuration Required'}
                 </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Key Status</span>
              <span className="text-[10px] font-mono text-gray-400">{keyDisplay}</span>
            </div>
            <button onClick={() => setShowTroubleshooter(true)} className="text-gray-600 hover:text-white transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest">Help</span>
            </button>
          </div>
        </div>
      </header>

      {showTroubleshooter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6">
          <div className="max-w-4xl w-full bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 shadow-3xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter mb-2 text-gradient bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">Configuration Guide</h2>
                <p className="text-gray-500 text-sm">If you see <code className="text-yellow-500 font-mono">NONE</code>, ensure your Environment Variable is set correctly.</p>
              </div>
              <button onClick={() => setShowTroubleshooter(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 group hover:border-yellow-500/30 transition-colors">
                  <h3 className="text-yellow-500 font-black text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-6 h-6 bg-yellow-500 text-black rounded-full flex items-center justify-center text-[10px]">1</span> 
                    Billing Activation
                  </h3>
                  <div className="space-y-4">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Image generation requires an API Key linked to a Google Cloud Project with <strong className="text-white">active billing</strong>. Even on the free tier, billing must be enabled.
                    </p>
                    <a href="https://console.cloud.google.com/billing" target="_blank" className="block w-full py-4 bg-yellow-500 text-black text-center text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/20">Link Billing Account ↗</a>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 h-full group hover:border-white/20 transition-colors">
                  <h3 className="text-yellow-500 font-black text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-6 h-6 bg-yellow-500 text-black rounded-full flex items-center justify-center text-[10px]">2</span> 
                    Environment Setup
                  </h3>
                  <div className="space-y-4">
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      If you are deploying this yourself, add <code className="text-white font-mono">API_KEY</code> to your project's environment variables in Vercel or your chosen host.
                    </p>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="block w-full py-4 border border-white/10 text-white text-center text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/5 transition-all">Get New API Key ↗</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow container mx-auto p-4 md:p-10 max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-4 space-y-8">
          <div className="bg-[#0a0a0a] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl space-y-8 sticky top-24">
            <section>
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4 block">1. Grid Screenshot</label>
              <ImageUploader onFileSelect={setSourceFile} />
            </section>
            
            <section className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4 block">2. Destination Atmosphere</label>
                <BackgroundSelector options={BACKGROUND_OPTIONS} selectedId={selectedBackgroundId} onSelect={setSelectedBackgroundId} />
              </div>
              
              <div>
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4 block">3. Mode / Vibe</label>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => setSelectedToneId(tone.id)}
                      className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                        selectedToneId === tone.id 
                          ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' 
                          : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                      }`}
                    >
                      {tone.name}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4 block">4. Final Directives</label>
              <PromptInput value={userPrompt} onChange={setUserPrompt} />
            </section>

            <button
              onClick={handleGenerate}
              disabled={isLoading || !sourceFile}
              className="w-full py-5 bg-yellow-500 text-black font-black rounded-3xl hover:bg-yellow-400 transition-all disabled:opacity-20 shadow-2xl shadow-yellow-500/10 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                   <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                   <span className="tracking-widest text-[10px] uppercase">{loadingStep}</span>
                </div>
              ) : (
                <span className="tracking-widest text-[10px] uppercase font-bold">RECONSTRUCT MEMORY</span>
              )}
            </button>
            
            <div className="flex bg-gray-900/50 rounded-xl p-1 border border-white/5">
              <button onClick={() => setModelTier('gemini-2.5-flash-image')} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-lg transition-all ${modelTier === 'gemini-2.5-flash-image' ? 'bg-white text-black' : 'text-gray-600'}`}>Flash Tier</button>
              <button onClick={() => setModelTier('gemini-3-pro-image-preview')} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-lg transition-all ${modelTier === 'gemini-3-pro-image-preview' ? 'bg-yellow-500 text-black' : 'text-gray-600'}`}>Pro Tier</button>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-8">
          <div className="bg-[#030303] rounded-[3rem] border border-white/5 p-8 min-h-[700px] flex flex-col relative shadow-inner overflow-hidden">
            {(error) ? (
              <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-[2rem] mb-10 animate-in slide-in-from-top-10 duration-500">
                <div className="flex items-start gap-6">
                  <div className="bg-red-500/10 p-4 rounded-2xl shrink-0 text-xl">⚠️</div>
                  <div className="space-y-4 w-full">
                    <h3 className="text-red-500 font-black uppercase text-xs tracking-[0.2em]">{error.isBilling ? "Billing Activation Required" : "Configuration Alert"}</h3>
                    <p className="text-red-200/60 text-sm leading-relaxed font-medium">{error.message}</p>
                    <div className="flex items-center gap-4 pt-2">
                       <button onClick={() => setShowTroubleshooter(true)} className="px-6 py-2.5 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all">Fix Error</button>
                       <button onClick={() => setError(null)} className="text-[9px] text-gray-600 font-bold uppercase underline">Dismiss</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {!isLoading && (generatedImages.length === 0) && !error && (
              <div className="flex-grow flex flex-col items-center justify-center text-gray-900 opacity-20">
                <SparkleIcon className="w-40 h-40 mb-10" />
                <p className="text-center font-black text-xs uppercase tracking-[0.8em] px-10">Awaiting Screenshot Input</p>
              </div>
            )}

            {isLoading && (
              <div className="flex-grow flex flex-col items-center justify-center">
                <div className="relative mb-10 scale-125">
                  <div className="w-32 h-32 border-2 border-yellow-500/5 rounded-full animate-ping"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-yellow-500/10 border-t-yellow-500 rounded-full animate-spin"></div>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-yellow-500 font-black text-xs uppercase tracking-[0.5em]">{loadingStep}</p>
                </div>
              </div>
            )}

            {(generatedImages.length > 0) && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                {generatedImages.map((src, i) => (
                  <div key={i} className={`group relative bg-black rounded-[2.5rem] overflow-hidden border border-white/5 shadow-3xl transition-all duration-500 hover:scale-[1.01] ${(i === 0) ? 'ring-2 ring-yellow-500/30' : ''}`}>
                    <img src={src} alt="Reconstructed Memory" className="w-full h-auto" />
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col items-center justify-center gap-6">
                       <a href={src} download={`official-memory-${i}.jpg`} className="px-12 py-5 bg-yellow-500 text-black font-black rounded-2xl text-[10px] tracking-[0.2em] uppercase hover:bg-yellow-400 active:scale-95 transition-all shadow-3xl shadow-yellow-500/30">Download Artifact</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      
      <footer className="p-10 border-t border-white/5 bg-black/90">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[10px] text-gray-700 font-black uppercase tracking-[0.4em] font-mono italic">
            {todayStr} • GATHERER_SYSTEM v2.2
          </div>
          <div className="flex gap-12 text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="hover:text-yellow-500 transition-colors">Billing Help</a>
            <span className="text-yellow-500/20 uppercase select-none">Official Memory Reconstruction</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
