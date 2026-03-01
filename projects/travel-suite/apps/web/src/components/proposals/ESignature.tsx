'use client';

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type MouseEvent,
  type TouchEvent,
} from 'react';
import { CheckCircle, Trash2, Download, PenLine } from 'lucide-react';

interface ESignatureProps {
  proposalId: string;
  clientName: string;
  onSigned: (signatureDataUrl: string) => void;
}

interface Point {
  x: number;
  y: number;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 150;

function getTimestampIST(): string {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }) + ' IST';
}

export default function ESignature({ proposalId: _proposalId, clientName, onSigned }: ESignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [signed, setSigned] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signedAt, setSignedAt] = useState<string>('');
  const [downloadFilename, setDownloadFilename] = useState('signed-proposal.png');
  const lastPoint = useRef<Point | null>(null);

  // Initialise canvas with guide line
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(16, CANVAS_HEIGHT - 28);
    ctx.lineTo(CANVAS_WIDTH - 16, CANVAS_HEIGHT - 28);
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  function getCanvasPoint(
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number
  ): Point {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function drawSegment(from: Point, to: Point) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    // Smooth curve through midpoint
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    ctx.quadraticCurveTo(from.x, from.y, midX, midY);
    ctx.stroke();
  }

  // Mouse events
  function handleMouseDown(e: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    setHasDrawing(true);
    lastPoint.current = getCanvasPoint(canvas, e.clientX, e.clientY);
  }

  function handleMouseMove(e: MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !lastPoint.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const current = getCanvasPoint(canvas, e.clientX, e.clientY);
    drawSegment(lastPoint.current, current);
    lastPoint.current = current;
  }

  function handleMouseUp() {
    setIsDrawing(false);
    lastPoint.current = null;
  }

  // Touch events
  function handleTouchStart(e: TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || !e.touches[0]) return;
    setIsDrawing(true);
    setHasDrawing(true);
    lastPoint.current = getCanvasPoint(canvas, e.touches[0].clientX, e.touches[0].clientY);
  }

  function handleTouchMove(e: TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    if (!isDrawing || !lastPoint.current || !e.touches[0]) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const current = getCanvasPoint(canvas, e.touches[0].clientX, e.touches[0].clientY);
    drawSegment(lastPoint.current, current);
    lastPoint.current = current;
  }

  function handleTouchEnd() {
    setIsDrawing(false);
    lastPoint.current = null;
  }

  function handleClear() {
    setHasDrawing(false);
    initCanvas();
  }

  function handleSign() {
    let dataUrl: string;
    if (hasDrawing && canvasRef.current) {
      dataUrl = canvasRef.current.toDataURL('image/png');
    } else if (typedName.trim()) {
      // Render typed name to canvas
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.font = 'italic 36px Georgia, serif';
      ctx.fillStyle = '#1e293b';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName.trim(), 16, CANVAS_HEIGHT / 2);
      dataUrl = canvas.toDataURL('image/png');
    } else {
      return;
    }

    const timestamp = getTimestampIST();
    const downloadStamp = new Date().toISOString().replace(/[:.]/g, "-");
    setSignatureDataUrl(dataUrl);
    setSignedAt(timestamp);
    setDownloadFilename(`signed-proposal-${downloadStamp}.png`);
    setSigned(true);
    onSigned(dataUrl);
  }

  const canSign = hasDrawing || typedName.trim().length > 0;

  if (signed && signatureDataUrl) {
    return (
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 pt-6 pb-5 space-y-5">
          {/* Success banner */}
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">Proposal Signed!</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Signed on {signedAt}
              </p>
            </div>
          </div>

          {/* Signature preview */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Your Signature
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signatureDataUrl}
              alt="Signature"
              className="w-full max-w-xs border border-gray-200 rounded-xl p-2 bg-white"
            />
          </div>

          {/* Timestamp */}
          <p className="text-xs text-gray-400">
            Signed on <span className="font-semibold text-gray-600">{signedAt}</span>
          </p>

          {/* Download */}
          <a
            href={signatureDataUrl}
            download={downloadFilename}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-emerald-500 rounded-xl px-4 py-2.5 hover:bg-emerald-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Signed Copy
          </a>

          {/* Legal note */}
          <p className="text-[10px] text-gray-400 border-t border-gray-100 pt-3">
            This signature is legally valid under the <span className="font-semibold">IT Act 2000 (India)</span>.
            Proposal ID: <span className="font-mono">{_proposalId}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-5 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <PenLine className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-800">Sign to Approve This Proposal</h3>
            <p className="text-xs text-gray-400 mt-0.5">Draw your signature below</p>
          </div>
        </div>

        {/* Legal text */}
        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl p-3 leading-relaxed">
          By signing below, I, <span className="font-semibold text-gray-700">{clientName}</span>,
          agree to the terms and conditions outlined in this proposal and authorise the tour
          operator to proceed with the booking.
        </p>

        {/* Canvas signature area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Draw Your Signature
            </label>
            {hasDrawing && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 text-xs text-rose-500 font-medium hover:text-rose-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          <div
            className={[
              'rounded-xl border-2 overflow-hidden cursor-crosshair transition-colors bg-white',
              isDrawing ? 'border-indigo-400' : hasDrawing ? 'border-gray-300' : 'border-dashed border-gray-300',
            ].join(' ')}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full block touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>

          {!hasDrawing && (
            <p className="text-[11px] text-center text-gray-400">
              Draw your signature with mouse or finger
            </p>
          )}
        </div>

        {/* Typed name fallback */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Or Type Your Name
          </label>
          <input
            type="text"
            value={typedName}
            onChange={(e) => {
              setTypedName(e.target.value);
              if (hasDrawing) {
                setHasDrawing(false);
                initCanvas();
              }
            }}
            placeholder={`e.g. ${clientName}`}
            className="w-full text-sm text-gray-700 placeholder-gray-300 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
          />
        </div>

        {/* Sign button */}
        <button
          type="button"
          onClick={handleSign}
          disabled={!canSign}
          className={[
            'w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200',
            canSign
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          ].join(' ')}
        >
          Sign & Approve Proposal
        </button>

        {/* Legal note */}
        <p className="text-[10px] text-gray-400 text-center">
          This signature is legally valid under the{' '}
          <span className="font-semibold">IT Act 2000 (India)</span>
        </p>
      </div>
    </div>
  );
}
