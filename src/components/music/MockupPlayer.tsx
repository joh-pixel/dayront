import { useState, useEffect, useRef } from 'preact/hooks';

export default function MockupPlayer() {
  const [title, setTitle] = useState('Midnight City');
  const [artist, setArtist] = useState('M83');
  const [art, setArt] = useState<File | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const artInput = useRef<HTMLInputElement>(null);

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 300;
    ctx.clearRect(0, 0, 600, 300);

    // Draw Card Background
    ctx.fillStyle = '#181818';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(0, 0, 600, 300, 24);
    else ctx.rect(0, 0, 600, 300);
    ctx.fill();

    // Draw Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(title.slice(0, 20), 290, 100);
    
    ctx.fillStyle = '#a0a0a0';
    ctx.font = '28px sans-serif';
    ctx.fillText(artist.slice(0, 20), 290, 140);

    // Draw Wave Placeholder
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(290, 180, 260, 4);

    // Draw Art
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

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'mockup-player.png';
    a.click();
  }

  return (
    <div class="max-w-2xl mx-auto space-y-6 text-gray-900 dark:text-gray-100">
      <div class="p-6 border rounded-2xl bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 class="text-xl font-bold mb-4">Live Preview</h2>
        <div class="bg-gray-100 dark:bg-black p-8 rounded-xl flex justify-center mb-6">
          <canvas ref={canvasRef} class="max-w-full h-auto drop-shadow-2xl rounded-xl" />
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-xs font-bold uppercase text-gray-500 mb-1 block">Song Title</label>
            <input 
              type="text" 
              value={title} 
              onInput={(e) => setTitle((e.target as HTMLInputElement).value)} 
              class="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700" 
            />
          </div>
          <div>
            <label class="text-xs font-bold uppercase text-gray-500 mb-1 block">Artist Name</label>
            <input 
              type="text" 
              value={artist} 
              onInput={(e) => setArtist((e.target as HTMLInputElement).value)} 
              class="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700" 
            />
          </div>
          <div>
            <label class="text-xs font-bold uppercase text-gray-500 mb-1 block">Album Art</label>
            <input 
              type="file" 
              accept="image/*" 
              ref={artInput} 
              class="hidden" 
              onChange={(e) => setArt((e.target as HTMLInputElement).files?.[0] || null)} 
            />
            <button onClick={() => artInput.current?.click()} class="w-full py-3 border-2 border-dashed rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
              {art ? art.name : 'Upload Album Art'}
            </button>
          </div>
        </div>

        <button onClick={download} class="w-full mt-6 py-4 bg-sky-500 rounded-xl font-bold text-white hover:bg-sky-600">
          Download Transparent PNG
        </button>
      </div>
    </div>
  );
}