export interface RenderOptions {
  color: string;
  color2: string;
  useGradient: boolean;
  glowIntensity: number;
  width: number;
  height: number;
}

export function renderTemplate(
  templateId: string,
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  opts: RenderOptions
) {
  const { width, height, color, color2, useGradient, glowIntensity } = opts;
  const cx = width / 2;
  const cy = height / 2;

  // Setup Colors
  let fillStyle: string | CanvasGradient = color;
  let strokeStyle: string | CanvasGradient = color;

  if (useGradient) {
    const grad = ctx.createLinearGradient(0, height, width, 0);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color2);
    fillStyle = grad;
    strokeStyle = grad;
  }

  // Setup Glow
  ctx.save();
  if (glowIntensity > 0) {
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = useGradient ? color2 : color;
  }
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;

  // --- RENDER ENGINES ---

  if (templateId === 'pulse') {
    // Image 6: Solid minimalist pulse
    ctx.beginPath();
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const sliceW = width / (data.length - 1);
    let x = 0;
    
    data.forEach((v, i) => {
      const norm = (v / 255) * 2 - 1;
      const y = cy + (norm * height * 0.3);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceW;
    });
    ctx.stroke();
  }

  else if (templateId === 'spectrum') {
    // Image 5: Rainbow mirrored dot-matrix
    ctx.shadowBlur = 0; // Disable glow for sharp dots
    const sliceW = width / data.length;
    
    data.forEach((v, i) => {
      const norm = v / 255;
      const barH = norm * height * 0.4;
      const x = i * sliceW;
      
      // Hue based on index
      const hue = (i / data.length) * 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      
      // Top half
      for (let y = 0; y < barH; y += 6) {
        ctx.fillRect(x, cy - y, sliceW * 0.6, 3);
      }
      // Bottom half
      for (let y = 0; y < barH; y += 6) {
        ctx.fillRect(x, cy + y, sliceW * 0.6, 3);
      }
    });
  }

  else if (templateId === 'particles') {
    // Image 3: Explosive particles
    ctx.fillStyle = fillStyle;
    const radius = 100;
    
    data.forEach((v, i) => {
      const norm = v / 255;
      const angle = (i / data.length) * Math.PI * 2;
      
      // Base ring
      const x1 = cx + Math.cos(angle) * radius;
      const y1 = cy + Math.sin(angle) * radius;
      
      // Explosion distance
      const blast = norm * 200;
      const x2 = cx + Math.cos(angle) * (radius + blast);
      const y2 = cy + Math.sin(angle) * (radius + blast);
      
      // Particle size
      const size = 2 + norm * 6;
      
      ctx.beginPath();
      // Draw a trail line
      if (blast > 10) {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      // Draw the particle
      ctx.beginPath();
      ctx.arc(x2, y2, size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  else if (templateId === 'multiwave') {
    // Image 4: Layered smooth waves
    const layers = 4;
    
    for (let l = 0; l < layers; l++) {
      ctx.beginPath();
      ctx.lineWidth = l === 0 ? 4 : 2;
      ctx.globalAlpha = l === 0 ? 1 : 0.4 / l;
      
      const sliceW = width / (data.length - 1);
      let x = 0;
      const offset = (l * Math.PI) / 4; // Phase shift
      
      data.forEach((v, i) => {
        const norm = v / 255;
        // Combine multiple sine waves for a fluid look
        const y = cy + Math.sin(i * 0.1 + offset) * (norm * height * 0.3);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceW;
      });
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0; // reset
  }

  else if (templateId === 'rings') {
    // Image 1: Concentric 3D rings
    const baseRadius = 60;
    const bass = data[0] / 255; // Use first bin for overall scale
    
    // Draw multiple rings
    for (let r = 0; r < 8; r++) {
      ctx.beginPath();
      ctx.lineWidth = r === 0 ? 6 : 2;
      ctx.globalAlpha = 1 - (r * 0.1);
      
      const currentRadius = baseRadius + (r * 30) + (bass * 100);
      
      // Draw an ellipse for 3D perspective
      ctx.ellipse(cx, cy, currentRadius, currentRadius * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }

  else if (templateId === 'sphere') {
    // Image 2: Pseudo-3D Wireframe Sphere
    const radius = 200;
    const rings = 12;
    const points = 24;
    
    for (let i = 0; i < rings; i++) {
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6;
      
      const lat = (Math.PI * i) / rings; // Latitude
      
      for (let j = 0; j <= points; j++) {
        const lon = (Math.PI * 2 * j) / points;
        
        // 3D to 2D projection
        let x = radius * Math.sin(lat) * Math.cos(lon);
        let y = radius * Math.sin(lat) * Math.sin(lon);
        let z = radius * Math.cos(lat);
        
        // Displacement based on audio data
        const audioValue = data[j % data.length] / 255;
        const displace = audioValue * 50;
        
        x += (x / radius) * displace;
        y += (y / radius) * displace;
        z += (z / radius) * displace;
        
        // Perspective
        const scale = 400 / (400 + z);
        const px = cx + x * scale;
        const py = cy + y * scale;
        
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }

  ctx.restore();
}