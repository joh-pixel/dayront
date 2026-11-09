import { useState, useRef, useEffect } from 'preact/hooks';
import { VisualTimeline } from './ui/VisualTimeline';
import RainbowWaveVisualizer, { RainbowWaveOptions } from './visualizers/RainbowWaveVisualizer';

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

type TemplateStyle = 'synthwave' | 'cyberpunk' | 'solar';

const TEMPLATES: Record<TemplateStyle, { name: string; options: RainbowWaveOptions }> = {
  synthwave: {
    name: 'Synthwave Ridge',
    options: {
      background: "#03030b",
      colors: ["#703cff", "#00f5ff", "#168bff", "#00ffcc", "#ffe45c", "#ff36c8"],
      amplitude: 6.5,
      sensitivity: 1.2,
      speed: 0.6,
      glow: 1.8,
      cameraTilt: 0.35,
    },
  },
  cyberpunk: {
    name: 'Cyberpunk Neon',
    options: {
      background: "#050508",
      colors: ["#ff0055", "#ff00ff", "#00ffff", "#00ff66", "#ffff00", "#ff3300"],
      amplitude: 7.0,
      sensitivity: 1.4,
      speed: 0.8,
      glow: 2.0,
      cameraTilt: 0.30,
    },
  },
  solar: {
    name: 'Solar Flare',
    options: {
      background: "#0a0402",
      colors: ["#330000", "#ff3300", "#ff6600", "#ffcc00", "#ffff66", "#ffffff"],
      amplitude: 6.0,
      sensitivity: 1.1,
      speed: 0.5,
      glow: 1.6,
      cameraTilt: 0.40,
    },
  },
};

export default function WaveformGenerator() {
  const [audio, setAudio] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null); 
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100); 
  
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateStyle>('synthwave');
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(64).fill(0));

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const fileInput = useRef<HTMLInputElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const isExportingRef = useRef(false);

  const smoothDataRef = useRef<number[]>(new Array(64).fill(0));

  function handleFile(e: any) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudio(file);
      setIsPlaying(false);
      setTrimStart(0);
      setTrimEnd(100); 
      setCurrentTime(0);
    }
  }

  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256; 
      
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    }
  }, [audioUrl]);

  async function togglePlay() {
    if (!audioRef.current || !audioCtxRef.current) return;
    if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current.currentTime >= trimEnd) {
        audioRef.current.currentTime = trimStart;
      }
      audioRef.current.play();
      setIsPlaying(true);
      startRenderLoop();
    }
  }

  function startRenderLoop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const renderFrame = () => {
      if (!isPlaying && !isExportingRef.current) return;
      rafRef.current = requestAnimationFrame(renderFrame);
      
      const analyser = analyserRef.current;
      if (analyser) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        const processedData = new Uint8Array(64);
        for (let i = 0; i < 64; i++) {
          const target = dataArray[i] * 3.0; 
          smoothDataRef.current[i] = smoothDataRef.current[i] * 0.7 + target * 0.3;
          processedData[i] = Math.min(255, smoothDataRef.current[i]);
        }
        setAudioData(processedData);
      }
    };
    renderFrame();
  }

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const onLoadedMetadata = () => { setDuration(audioEl.duration); setTrimEnd(audioEl.duration); };
    const onTimeUpdate = () => {
      setCurrentTime(audioEl.currentTime);
      if (isExportingRef.current) {
        const total = trimEnd - trimStart;
        const current = audioEl.currentTime - trimStart;
        setExportProgress(Math.min(100, Math.round((current / total) * 100)));
      }
      if (audioEl.currentTime >= trimEnd && !isExportingRef.current && isPlaying) {
        audioEl.currentTime = trimStart; 
      }
    };

    audioEl.addEventListener('loadedmetadata', onLoadedMetadata);
    audioEl.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      audioEl.removeEventListener('loadedmetadata', onLoadedMetadata);
      audioEl.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [isPlaying, trimStart, trimEnd]);

  useEffect(() => { 
    return () => { 
      if (rafRef.current) cancelAnimationFrame(rafRef.current); 
      if (audioCtxRef.current) audioCtxRef.current.close(); 
    }; 
  }, []);

  function downloadImage() {
    if (!threeCanvasRef.current) return;
    const url = threeCanvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `reels-wave-${Date.now()}.png`;
    a.click();
  }

  async function exportVideo() {
    if (!threeCanvasRef.current || !audioRef.current || !audioCtxRef.current) return;
    
    isExportingRef.current = true;
    setIsExporting(true);
    setExportProgress(0);
    
    if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
    audioRef.current.currentTime = trimStart;
    
    const canvasStream = threeCanvasRef.current.captureStream(60);
    const dest = audioCtxRef.current.createMediaStreamDestination();
    analyserRef.current!.connect(dest); 

    const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
    let mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';

    const recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 6000000 });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reels-wave-${Date.now()}.webm`;
      a.click();
      dest.disconnect();
      isExportingRef.current = false;
      setIsExporting(false);
      setExportProgress(100);
    };

    recorder.start();
    audioRef.current.play();
    setIsPlaying(true);
    startRenderLoop();

    const checkStop = setInterval(() => {
      if (audioRef.current!.currentTime >= trimEnd) {
        audioRef.current!.pause();
        if (recorder.state === 'recording') recorder.stop();
        clearInterval(checkStop);
      }
    }, 50);
  }

  return (
    <div class="max-w-xl mx-auto space-y-6 text-gray-900 dark:text-gray-100 pb-24 px-4">
      {audioUrl && <audio ref={audioRef} src={audioUrl} class="hidden" crossOrigin="anonymous" />}

      {/* Top Navbar Header */}
      <div class="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl -mx-4 px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h1 class="text-lg font-black tracking-tight">Reels Wave Studio</h1>
          <p class="text-xs text-gray-500 font-medium">9:16 Vertical Content Generator</p>
        </div>
        <button 
          onClick={exportVideo} 
          disabled={!audio || isExporting} 
          class="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-full font-bold text-sm shadow-lg shadow-sky-500/25 disabled:opacity-50 hover:opacity-90 transition"
        >
          {isExporting ? `Rendering ${exportProgress}%` : 'Export Reel'}
        </button>
      </div>

      <div class="space-y-6 pt-2">
        
        {/* Vertical 9:16 Reels Preview Area */}
        <div class="flex flex-col items-center">
          <div class="w-full max-w-[320px] relative rounded-3xl overflow-hidden aspect-[9/16] bg-[#03030b] shadow-2xl border-4 border-gray-800/80 ring-1 ring-white/10">
            
            <RainbowWaveVisualizer 
              audioData={audioData} 
              canvasRef={threeCanvasRef}
              className="absolute inset-0" 
              options={TEMPLATES[selectedTemplate].options}
            />

            {/* Watermark / Branding Overlay for Reels */}
            <div class="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
              <span class="text-[10px] tracking-widest font-mono text-white/40 uppercase bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                {TEMPLATES[selectedTemplate].name}
              </span>
            </div>

            {isExporting && (
              <div class="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                <div class="w-14 h-14 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p class="text-white font-bold text-base">Rendering Reel...</p>
                <p class="text-sky-400 font-mono text-sm mt-1">{exportProgress}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Template Selector */}
        {audio && (
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">Visual Template</label>
            <div class="grid grid-cols-3 gap-2">
              {(Object.keys(TEMPLATES) as TemplateStyle[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedTemplate(key)}
                  class={`py-3 px-2 rounded-2xl font-bold text-xs border transition-all flex flex-col items-center justify-center gap-1 ${
                    selectedTemplate === key
                      ? 'bg-sky-500/10 border-sky-500 text-sky-400 shadow-md shadow-sky-500/10'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                  }`}
                >
                  <span>{TEMPLATES[key].name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timeline & Audio Controls */}
        {audio ? (
          <div class="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <button 
                onClick={togglePlay} 
                class="h-12 w-12 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 shadow-lg shadow-sky-500/30 transition transform active:scale-95"
              >
                {isPlaying ? (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
                ) : (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>
              <div class="text-right">
                <p class="text-xl font-bold font-mono">{formatTime(currentTime)}</p>
                <p class="text-xs text-gray-500 font-mono">-{formatTime(duration - currentTime)}</p>
              </div>
            </div>

            <VisualTimeline 
              audioFile={audio} 
              duration={duration} 
              trimStart={trimStart} 
              trimEnd={trimEnd} 
              currentTime={currentTime}
              onChange={(start, end) => { setTrimStart(start); setTrimEnd(end); }}
              onSeek={(t) => { if (audioRef.current) audioRef.current.currentTime = t; }}
            />

            <div class="flex justify-between text-xs font-mono text-gray-400">
              <span>Start: {formatTime(trimStart)}</span>
              <span>End: {formatTime(trimEnd)}</span>
            </div>
          </div>
        ) : (
          <div class="p-10 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-gray-900/50">
            <div class="text-4xl mb-3">🎵</div>
            <h2 class="text-base font-bold mb-1">Upload track for your Reel</h2>
            <p class="text-xs text-gray-500 mb-5">Supports MP3, WAV, or M4A</p>
            <input type="file" accept="audio/*" ref={fileInput} class="hidden" onChange={handleFile} />
            <button 
              onClick={() => fileInput.current?.click()} 
              class="px-6 py-3 bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/30 hover:scale-105 transition-transform text-sm"
            >
              Browse Audio File
            </button>
          </div>
        )}

        {/* Download Static Image Option */}
        <button 
          onClick={downloadImage} 
          disabled={!audio || isExporting} 
          class="w-full py-3.5 bg-gray-100 dark:bg-gray-800 rounded-2xl font-bold text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50 text-gray-700 dark:text-gray-300"
        >
          Download Current Frame (PNG)
        </button>

      </div>
    </div>
  );
}
