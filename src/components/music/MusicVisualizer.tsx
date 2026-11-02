import { useState, useEffect, useRef } from 'preact/hooks';
import { composeMusicVideo } from '../../lib/ffmpeg';

export default function MusicVisualizer() {
  const [bgVideo, setBgVideo] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [art, setArt] = useState<File | null>(null);
  const [title, setTitle] = useState('Midnight City');
  const [artist, setArtist] = useState('M83');
  
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgInput = useRef<HTMLInputElement>(null);
  const audioInput = useRef<HTMLInputElement>(null);
  const artInput = useRef<HTMLInputElement>(null);

  // Draw Canvas Card (Same logic as MockupPlayer)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 300;
    ctx.clearRect(0, 0, 600, 300);
    ctx.fillStyle = '#181818';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(0, 0, 600, 300, 24);
    else ctx.rect(0, 0, 600, 300);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(title.slice(0, 20), 290, 100);
    
    ctx.fillStyle = '#a0a0a0';
    ctx.font = '28px sans-serif';
    ctx.fillText(artist.slice(0, 20), 290, 140);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(290, 180, 260, 4);

    if (art) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(40, 40, 220, 220, 12);
        else ctx.rect(40, 40, 220, 220);
        ctx.clip();
        ctx.drawImage(img, 40, 40, 220, 220);
        ctx.restore();
      };
      img.src = URL.createObjectURL(art);
    } else {
      ctx.fillStyle = '#282828';
      ctx.fillRect(40, 40, 220, 220);
    }
  }, [title, artist, art]);

  async function generate() {
    if (!bgVideo || !audio) return alert('Need video and audio');
    setProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');
      
      const cardBlob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
      if (!cardBlob) throw new Error('Failed to create card');

      const blob = await composeMusicVideo(
        bgVideo, 
        audio, 
        cardBlob, 
        '#38bdf8', 
        false, 
        'mp4', 
        setProgress
      );
      setResultUrl(URL.createObjectURL(blob));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div class="max-w-4xl mx-auto space-y-6 text-gray-900 dark:text-gray-100">
      <div class="grid md:grid-cols-2 gap-6">
        
        {/* Left: Inputs */}
        <div class="space-y-4">
          <div class="p-4 border rounded-xl bg-white dark:bg-gray-900 dark:border-gray-800">
            <h3 class="font-bold mb-2">Background Video</h3>
            <input 
              type="file" 
              accept="video/*" 
              ref={bgInput} 
              class="hidden" 
              onChange={(e) => setBgVideo((e.target as HTMLInputElement).files?.[0] || null)} 
            />
            <button onClick={() => bgInput.current?.click()} class="w-full py-2 border-2 border-dashed rounded-lg text-sm font-medium">
              {bgVideo ? bgVideo.name : 'Upload MP4 / MOV'}
            </button>
          </div>
          
          <div class="p-4 border rounded-xl bg-white dark:bg-gray-900 dark:border-gray-800">
            <h3 class="font-bold mb-2">Audio Track</h3>
            <input 
              type="file" 
              accept="audio/*" 
              ref={audioInput} 
              class="hidden" 
              onChange={(e) => setAudio((e.target as HTMLInputElement).files?.[0] || null)} 
            />
            <button onClick={() => audioInput.current?.click()} class="w-full py-2 border-2 border-dashed rounded-lg text-sm font-medium">
              {audio ? audio.name : 'Upload MP3 / WAV'}
            </button>
          </div>

          <div class="p-4 border rounded-xl bg-white dark:bg-gray-900 dark:border-gray-800 space-y-3">
            <input type="text" value={title} onInput={e => setTitle((e.target as HTMLInputElement).value)} class="w-full p-2 border rounded text-sm dark:bg-gray-800" placeholder="Song Title" />
            <input type="text" value={artist} onInput={e => setArtist((e.target as HTMLInputElement).value)} class="w-full p-2 border rounded text-sm dark:bg-gray-800" placeholder="Artist Name" />
            <input 
              type="file" 
              accept="image/*" 
              ref={artInput} 
              class="hidden" 
              onChange={(e) => setArt((e.target as HTMLInputElement).files?.[0] || null)} 
            />
            <button onClick={() => artInput.current?.click()} class="w-full py-2 border-2 border-dashed rounded-lg text-sm font-medium">
              {art ? art.name : 'Upload Album Art'}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div class="p-6 bg-gray-100 dark:bg-black rounded-2xl flex flex-col items-center justify-center">
          <p class="text-xs font-bold uppercase text-gray-500 mb-4">Live Card Preview</p>
          <canvas ref={canvasRef} class="max-w-full h-auto drop-shadow-xl rounded-xl" />
          <p class="text-xs text-gray-500 mt-4 text-center">The wave will bounce inside the empty space below the text.</p>
        </div>
      </div>

      <button onClick={generate} disabled={processing || !bgVideo || !audio} class="w-full py-4 bg-sky-500 rounded-xl font-bold text-white hover:bg-sky-600 disabled:opacity-50">
        {processing ? `Rendering Final Video ${progress}%...` : 'Generate Final Video'}
      </button>

      {resultUrl && (
        <div class="p-6 border rounded-2xl bg-green-50 dark:bg-green-950/20 dark:border-green-900">
          <video src={resultUrl} controls class="w-full rounded-lg mb-4" />
          <a href={resultUrl} download="music-visualizer.mp4" class="block text-center w-full py-3 bg-sky-500 rounded-xl font-bold text-white">Download Video</a>
        </div>
      )}
    </div>
  );
}