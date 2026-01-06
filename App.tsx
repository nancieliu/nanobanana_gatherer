
import React, { useState, useCallback, useEffect } from 'react';
import { verifyImageContent, generateGatheringImageVariation } from './services/geminiService';
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
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Handle Pro key selection
  const handleSelectProKey = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setShowProSelector(false);
    } else {
      setError("AI Studio key selection is only available in the AI Studio environment. Please use Standard mode or configure Vercel env vars.");
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
        }
      }
    }
    setModelTier(model);
  };

  const handleGenerate = useCallback(async () => {
    if (!sourceFile) {
      setError('Please upload a screenshot first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const imageData = await fileToBase64(sourceFile);
      
      setLoadingStep('Verifying image content...');
      const isValid = await verifyImageContent(imageData);
      if (!isValid) {
        throw new Error('No clear faces detected. Please upload a better screenshot of your group.');
      }

      setLoadingStep('Generating 3 unique memories...');
      const selectedBg = BACKGROUND_OPTIONS.find(bg => bg.id === selectedBackgroundId);
      if (!selectedBg) throw new Error('Background error');
      
      const finalPrompt = `${selectedBg.prompt}. ${userPrompt}`;
      
      const generationTasks = STYLE_VARIATIONS.map(style => 
        generateGatheringImageVariation(
          imageData, 
          finalPrompt, 
          style, 
          { model: modelTier, resolution, aspectRatio }
        )
      );

      const base64Results = await Promise.all(generationTasks);

      setLoadingStep('Adding memory stamps...');
      const stampedResults = await Promise.all(
        base64Results.map(b64 => addDateFooter(b64, todayStr))
      );

      setGeneratedImages(stampedResults.map(s => `data:image/jpeg;base64,${s}`));
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('API_KEY_INVALID') || err.message?.includes('Requested entity was not found')) {
        setError('Your API key is missing or invalid. If using Pro, please select a key. If using Standard, ensure the API_KEY environment variable is set in Vercel.');
        if (modelTier === 'gemini-3-pro-image-preview') setShowProSelector(true);
      } else {
        setError(err.message || 'An error occurred during generation.');
      }
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  }, [sourceFile, selectedBackgroundId, userPrompt, modelTier, resolution, aspectRatio, todayStr]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-sans flex flex-col relative">
      {/* Pro Key Selector Modal */}
      {showProSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-6">
          <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <SparkleIcon className="w-16 h-16 text-yellow-500 mx-auto" />
            <h2 className="text-2xl font-bold">Unlock Gemini Pro</h2>
            <p className="text-gray-400 text-sm">
              To generate high-quality 4K images, you must select a paid API key from a billing-enabled project.
            </p>
            <div className="space-y-4">
              <button 
                onClick={handleSelectProKey}
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl transition-all shadow-lg shadow-yellow-500/10"
              >
                Select Paid API Key
              </button>
              <button 
                onClick={() => { setModelTier('gemini-2.5-flash-image'); setShowProSelector(false); }}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all"
              >
                Back to Standard
              </button>
            </div>
            <div className="pt-4 border-t border-gray-800">
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-yellow-500 underline uppercase tracking-widest">
                Billing Documentation
              </a>
            </div>
          </div>
        </div>
      )}

      <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 p-4 sticky top-0 z-20">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-yellow-500 tracking-tighter uppercase">Gatherer</h1>
            <div className="hidden sm:flex gap-2 bg-gray-800 rounded-full p-1 border border-gray-700 scale-90">
              <button 
                onClick={() => changeModel('gemini-2.5-flash-image')} 
                className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${modelTier === 'gemini-2.5-flash-image' ? 'bg-yellow-500 text-black' : 'text-gray-500'}`}
              >
                STANDARD
              </button>
              <button 
                onClick={() => changeModel('gemini-3-pro-image-preview')} 
                className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${modelTier === 'gemini-3-pro-image-preview' ? 'bg-yellow-500 text-black' : 'text-gray-500'}`}
              >
                PRO
              </button>
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 py-1 border border-gray-800 rounded-lg">
            {modelTier === 'gemini-3-pro-image-preview' ? 'Pro High-Def' : 'Standard Memory'}
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-800 space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">1. Screenshot</label>
                <ImageUploader onFileSelect={setSourceFile} />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">2. Setting</label>
                <BackgroundSelector options={BACKGROUND_OPTIONS} selectedId={selectedBackgroundId} onSelect={setSelectedBackgroundId} />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">3. Custom Details</label>
                <PromptInput value={userPrompt} onChange={setUserPrompt} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Aspect</label>
                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm">
                      {ASPECT_RATIOS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Resolution</label>
                    <select disabled={modelTier === 'gemini-2.5-flash-image'} value={resolution} onChange={(e) => setResolution(e.target.value as ImageResolution)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm disabled:opacity-30">
                      {RESOLUTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                 </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading || !sourceFile}
                className="w-full py-4 bg-yellow-500 text-gray-950 font-black rounded-xl hover:bg-yellow-400 transition-all disabled:opacity-20 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><span className="animate-spin text-xl">◌</span> {loadingStep}</>
                ) : (
                  <><SparkleIcon /> Generate 3 Memories</>
                )}
              </button>
            </div>
          </div>

          {/* Result Gallery */}
          <div className="lg:col-span-8">
            <div className="bg-gray-900/20 rounded-3xl border border-dashed border-gray-800 p-6 min-h-[600px] flex flex-col">
              {error && (
                <div className="bg-red-950/20 border border-red-500/50 p-6 rounded-2xl text-center mb-6">
                  <p className="text-red-400 font-medium mb-4">{error}</p>
                  <button onClick={() => setError(null)} className="px-4 py-2 bg-gray-800 rounded-lg text-sm text-white hover:bg-gray-700">Dismiss</button>
                </div>
              )}

              {!isLoading && generatedImages.length === 0 && !error && (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-600">
                  <SparkleIcon className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-center italic">Upload a screenshot to generate your memory album...</p>
                </div>
              )}

              {isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center space-y-6">
                  <div className="w-16 h-16 border-4 border-yellow-500/10 border-t-yellow-500 rounded-full animate-spin"></div>
                  <p className="text-yellow-500 font-bold animate-pulse">{loadingStep}</p>
                </div>
              )}

              {generatedImages.length > 0 && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                    <h2 className="text-xl font-bold">Generated Memories</h2>
                    <span className="text-xs text-gray-500 italic">3 Variations Created</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {generatedImages.map((src, i) => (
                      <div key={i} className="group relative bg-black rounded-xl overflow-hidden border border-gray-800 shadow-2xl transition-transform hover:scale-[1.02]">
                        <img src={src} alt={`Memory ${i+1}`} className="w-full h-auto" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                           <a href={src} download={`memory-${i+1}.jpg`} className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg text-sm">Download</a>
                           <span className="text-[10px] text-white/50 uppercase tracking-widest">Version {i+1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center pt-8">
                     <button onClick={() => setGeneratedImages([])} className="text-sm text-gray-500 hover:text-white transition-colors">Generate different set →</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-black/50 p-4 border-t border-gray-900">
        <div className="container mx-auto text-center text-[10px] text-gray-600 uppercase tracking-widest">
          Memory Captured: {todayStr} • Built for Digital Gathering
        </div>
      </footer>
    </div>
  );
};

export default App;
