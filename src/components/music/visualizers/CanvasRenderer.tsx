import { useEffect, useRef } from 'preact/hooks';

interface Props {
  data: Uint8Array;
  template: string;
  color: string;
}

export function CanvasRenderer({ data, template, color }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Keep the canvas resolution high for crisp rendering
    const width = 1280;
    const height = 720;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw the template
    if (template === 'bars') {
      const barWidth = (width / data.length) * 0.8;
      const gap = (width / data.length) * 0.2;
      
      data.forEach((value, i) => {
        const barHeight = (value / 255) * (height * 0.8);
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 8);
        ctx.fill();
      });
    } 
    else if (template === 'wave') {
      ctx.beginPath();
      ctx.lineWidth = 8;
      ctx.strokeStyle = color;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      const sliceWidth = width / (data.length - 1);
      let x = 0;

      data.forEach((value, i) => {
        // Normalize value to center (0 -> -1, 255 -> 1)
        const normalized = (value / 255) * 2 - 1;
        // Amplify the wave slightly
        const y = (height / 2) + (normalized * height * 0.4);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      });
      ctx.stroke();
    }
    else if (template === 'circular') {
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = 150;

      data.forEach((value, i) => {
        const angle = (i / data.length) * Math.PI * 2 - Math.PI / 2;
        const barHeight = (value / 255) * 150;

        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = 6;
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        ctx.stroke();
      });
    }
  }, [data, template, color]);

  return (
    <canvas 
      ref={canvasRef} 
      class="w-full h-auto max-h-[60vh] object-contain rounded-xl bg-black shadow-lg"
    />
  );
}