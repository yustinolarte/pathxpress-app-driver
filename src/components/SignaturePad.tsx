import { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, X } from 'lucide-react';

interface SignaturePadProps {
    onSave: (signatureData: string) => void;
    onCancel: () => void;
    customerName: string;
}

export function SignaturePad({ onSave, onCancel, customerName }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set canvas size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2; // Higher res for better quality
        canvas.height = rect.height * 2;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.scale(2, 2);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctxRef.current = ctx;
    }, []);

    const getCoordinates = (e: React.TouchEvent | React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();

        if ('touches' in e) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        } else {
            return {
                x: (e as React.MouseEvent).clientX - rect.left,
                y: (e as React.MouseEvent).clientY - rect.top
            };
        }
    };

    const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        const ctx = ctxRef.current;
        if (!ctx) return;

        setIsDrawing(true);
        const { x, y } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDrawing) return;
        e.preventDefault();

        const ctx = ctxRef.current;
        if (!ctx) return;

        const { x, y } = getCoordinates(e);
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    const saveSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasSignature) return;

        const signatureData = canvas.toDataURL('image/png');
        onSave(signatureData);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end">
            <div className="w-full bg-white rounded-t-[2rem] p-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={onCancel}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                    <h3 className="text-lg font-bold text-gray-900">Customer Signature</h3>
                    <button
                        onClick={clearSignature}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                    >
                        <RotateCcw className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Customer name */}
                <p className="text-center text-gray-500 text-sm mb-4">
                    Ask <strong>{customerName}</strong> to sign below
                </p>

                {/* Signature Canvas */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 mb-4">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-40 touch-none"
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                    />
                </div>

                {/* Signature Line */}
                <div className="border-b-2 border-gray-300 mx-8 mb-6 relative">
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-3 bg-white px-3 text-xs text-gray-400">
                        Sign here
                    </span>
                </div>

                {/* Action Button */}
                <button
                    onClick={saveSignature}
                    disabled={!hasSignature}
                    className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${hasSignature
                            ? 'bg-black text-white'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    <Check className="w-5 h-5" />
                    Confirm Signature
                </button>
            </div>
        </div>
    );
}
