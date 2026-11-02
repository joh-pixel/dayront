import { useState, useRef } from 'preact/hooks';
import { generateWaveformVideo } from '../../lib/ffmpeg';

export default function WaveformGenerator() {
  const [audio, setAudio] = useState<File | null>(null);
  const [color, setColor] = useState('#38bdf8');
  const [isTransparent, setIsTransparent] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);

  async function generate() {
    if (!audio) return;
    setProcessing(true);
    setProgress(0);
    try {
      const ext = isTransparent ? 'webm' : 'mp4';
      const blob = await generateWaveformVideo(audio, color, isTransparent, ext, setProgress);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div class="max-w-2xl mx-auto space-y-6 text-gray-900 dark:text-gray-100">
      <div class="p-6 border rounded-2xl bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 class="text-xl font-bold mb-4">1. Choose Audio</h2>
        <input 
          type="file" 
          accept="audio/*" 
          ref={fileInput} 
          class="hidden" 
          onChange={(e) => setAudio((e.target as HTMLInputElement).files?.[0] || null)} 
        />
        <button onClick={() => fileInput.current?.click()} class="w-full py-3 rounded-xl border-2 border-dashed font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
          {audio ? audio.name : 'Upload MP3 / WAV'}
        </button>

        <h2 class="text-xl font-bold mt-8 mb-4">2. Style</h2>
        <div class="flex items-center gap-4 mb-4">
          <label class="text-sm font-medium">Wave Color</label>
          <input 
            type="color" 
            value={color} 
            onInput={(e) => setColor((e.target as HTMLInputElement).value)} 
            class="h-10 w-20 rounded cursor-pointer" 
          />
        </div>
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium">Background</label>
          <select 
            value={isTransparent ? 'webm' : 'mp4'} 
            onChange={(e) => setIsTransparent((e.target as HTMLSelectElement).value === 'webm')} 
            class="p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="webm">Transparent (WebM)</option>
            <option value="mp4">Solid Black (MP4)</option>
          </select>
        </div>

        <button onClick={generate} disabled={!audio || processing} class="w-full mt-8 py-4 bg-sky-500 rounded-xl font-bold text-white hover:bg-sky-600 disabled:opacity-50">
          {processing ? `Rendering ${progress}%...` : 'Generate Waveform'}
        </button>
      </div>

      {resultUrl && (
        <div class="p-6 border rounded-2xl bg-green-50 dark:bg-green-950/20 dark:border-green-900 text-center">
          <h3 class="font-bold text-lg mb-4 text-green-900 dark:text-green-100">Waveform Ready</h3>
          <video src={resultUrl} controls class="w-full rounded-lg bg-black mb-4" />
          <a href={resultUrl} download={`waveform.${isTransparent ? 'webm' : 'mp4'}`} class="inline-block w-full py-3 bg-sky-500 rounded-xl font-bold text-white">Download Overlay</a>
        </div>
      )}
    </div>
  );
}