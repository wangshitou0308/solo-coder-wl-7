import { useEffect, useRef } from 'react';

interface RelicCanvasProps {
  pixelData: number[][];
  size?: number;
}

export default function RelicCanvas({ pixelData, size = 256 }: RelicCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pixelData || pixelData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixelSize = size / pixelData.length;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, size, size);

    for (let y = 0; y < pixelData.length; y++) {
      for (let x = 0; x < pixelData[y].length; x++) {
        const color = pixelData[y][x];
        if (color !== 0x000000) {
          const r = (color >> 16) & 0xff;
          const g = (color >> 8) & 0xff;
          const b = color & 0xff;
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize + 0.5, pixelSize + 0.5);
        }
      }
    }

    ctx.strokeStyle = 'rgba(233, 69, 96, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, size, size);
  }, [pixelData, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="relic-canvas"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
