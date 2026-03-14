import { useRef, useState, useCallback, useEffect } from 'react';
import styles from './CanvasEditor.module.css';

export type EditorMode = 'draw' | 'type';
type DrawTool = 'pen' | 'eraser';

const FONTS = [
  { name: 'Dancing Script', label: 'Script' },
  { name: 'Caveat', label: 'Casual' },
  { name: 'Inter', label: 'Sans' },
  { name: 'Georgia', label: 'Serif' },
];

interface CanvasEditorProps {
  width?: number;
  height?: number;
  backgroundImage?: string;
  onExport: (dataUrl: string) => void;
  showTyping?: boolean;
}

export default function CanvasEditor({
  width = 500,
  height = 200,
  backgroundImage,
  onExport,
  showTyping = true,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<EditorMode>('draw');
  const [drawTool, setDrawTool] = useState<DrawTool>('pen');
  const [color, setColor] = useState('#f8fafc');
  const [brushSize, setBrushSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [selectedFont, setSelectedFont] = useState(FONTS[0].name);
  const historyRef = useRef<ImageData[]>([]);

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Caveat:wght@400;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  // Draw background image
  useEffect(() => {
    if (!backgroundImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      saveHistory();
    };
    img.src = backgroundImage;
  }, [backgroundImage]);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (historyRef.current.length > 30) historyRef.current.shift();
  };

  const undo = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length === 0) return;
    const ctx = canvas.getContext('2d')!;
    historyRef.current.pop(); // remove current
    if (historyRef.current.length > 0) {
      ctx.putImageData(historyRef.current[historyRef.current.length - 1], 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    historyRef.current = [];
    if (backgroundImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        saveHistory();
      };
      img.src = backgroundImage;
    }
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }, [mode]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== 'draw') return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    if (drawTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, mode, drawTool, color, brushSize]);

  const endDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistory();
    }
  }, [isDrawing]);

  const handleExport = () => {
    if (mode === 'type' && typedText.trim()) {
      // Render typed text to canvas and export
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const ctx = tempCanvas.getContext('2d')!;
      if (backgroundImage) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          ctx.font = `48px '${selectedFont}'`;
          ctx.fillStyle = color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(typedText, width / 2, height / 2);
          onExport(tempCanvas.toDataURL('image/png'));
        };
        img.src = backgroundImage;
        return;
      }
      ctx.font = `48px '${selectedFont}'`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedText, width / 2, height / 2);
      onExport(tempCanvas.toDataURL('image/png'));
    } else {
      const canvas = canvasRef.current;
      if (canvas) onExport(canvas.toDataURL('image/png'));
    }
  };

  return (
    <div className={styles.container}>
      {showTyping && (
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${mode === 'draw' ? styles.tabActive : ''}`} onClick={() => setMode('draw')}>✏️ Draw</button>
          <button className={`${styles.tab} ${mode === 'type' ? styles.tabActive : ''}`} onClick={() => setMode('type')}>⌨️ Type</button>
        </div>
      )}

      {mode === 'draw' && (
        <>
          <div className={styles.toolbar}>
            <button className={`${styles.toolButton} ${drawTool === 'pen' ? styles.toolButtonActive : ''}`} onClick={() => setDrawTool('pen')} title="Pen">✏️</button>
            <button className={`${styles.toolButton} ${drawTool === 'eraser' ? styles.toolButtonActive : ''}`} onClick={() => setDrawTool('eraser')} title="Eraser">🧹</button>
            <div className={styles.divider} />
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className={styles.colorInput} title="Color" />
            <div className={styles.sliderGroup}>
              <span>Size</span>
              <input type="range" min={1} max={20} value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className={styles.slider} />
              <span>{brushSize}</span>
            </div>
            <div className={styles.divider} />
            <button className={styles.toolButton} onClick={undo} title="Undo">↩️</button>
            <button className={styles.toolButton} onClick={clear} title="Clear">🗑️</button>
          </div>
          <div className={styles.canvasWrapper}>
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className={styles.canvas}
              style={{ width: '100%', height: 'auto' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
            />
          </div>
        </>
      )}

      {mode === 'type' && (
        <>
          <div className={styles.toolbar}>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className={styles.colorInput} title="Color" />
            <select className={styles.fontSelect} value={selectedFont} onChange={e => setSelectedFont(e.target.value)}>
              {FONTS.map(f => <option key={f.name} value={f.name}>{f.label}</option>)}
            </select>
          </div>
          <input
            className={styles.typeInput}
            value={typedText}
            onChange={e => setTypedText(e.target.value)}
            placeholder="Type your signature..."
            style={{ fontFamily: `'${selectedFont}', cursive` }}
          />
          {typedText && (
            <div className={styles.typePreview}>
              <span className={styles.typeSignature} style={{ fontFamily: `'${selectedFont}', cursive`, color }}>{typedText}</span>
            </div>
          )}
        </>
      )}

      <div className={styles.actions}>
        <button
          onClick={handleExport}
          style={{
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '12px 24px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ✅ Apply
        </button>
      </div>
    </div>
  );
}
