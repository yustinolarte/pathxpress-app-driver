import { useRef, useState, useEffect } from 'react';

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
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(2, 2);
        ctx.strokeStyle = '#ffffff';
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
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
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

    const stopDrawing = () => { setIsDrawing(false); };

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
        onSave(canvas.toDataURL('image/png'));
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end">
            <div className="w-full bg-background rounded-t-3xl p-5 pb-[calc(2rem+env(safe-area-inset-bottom))] border-t border-gray-800/50">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onCancel} className="w-10 h-10 rounded-full bg-surface-dark flex items-center justify-center border border-gray-800/50">
                        <span className="material-symbols-rounded text-gray-400 text-xl">close</span>
                    </button>
                    <h3 className="text-lg font-bold text-foreground">Customer Signature</h3>
                    <button onClick={clearSignature} className="w-10 h-10 rounded-full bg-surface-dark flex items-center justify-center border border-gray-800/50">
                        <span className="material-symbols-rounded text-gray-400 text-xl">refresh</span>
                    </button>
                </div>

                <p className="text-center text-gray-500 text-sm mb-4">
                    Ask <strong className="text-foreground">{customerName}</strong> to sign below
                </p>

                {/* Canvas */}
                <div className="border-2 border-dashed border-gray-700 rounded-xl overflow-hidden bg-surface-dark mb-4">
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

                <div className="border-b-2 border-gray-700 mx-8 mb-5 relative">
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-3 bg-background px-3 text-xs text-gray-600">Sign here</span>
                </div>

                <button
                    onClick={saveSignature}
                    disabled={!hasSignature}
                    className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${hasSignature ? 'bg-primary text-white active:scale-[0.98]' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    <span className="material-symbols-rounded text-xl">check</span>
                    Confirm Signature
                </button>
            </div>
        </div>
    );
}
