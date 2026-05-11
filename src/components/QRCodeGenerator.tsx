import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';

interface QRCodeGeneratorProps {
    trainerId: string;
    onClose: () => void;
}

export function QRCodeGenerator({ trainerId, onClose }: QRCodeGeneratorProps) {
    const nonce = crypto.randomUUID();
    const timestamp = Date.now();
    
    const payload = JSON.stringify({
        trainerId,
        timestamp,
        nonce
    });

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6">
            <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-8 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Session QR Code</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-inner mb-6">
                    <QRCodeSVG 
                        value={payload} 
                        size={220}
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                        level={"H"}
                    />
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 text-center">Scan to Log Session</h3>
                <p className="text-zinc-400 text-sm text-center mb-4">
                    Have your client open their app and scan this QR code to automatically deduct a session from their package.
                </p>
                <div className="px-6 py-2 bg-zinc-900/80 rounded-full border border-white/5">
                    <p className="text-xs text-red-400 font-medium">Expires in 2 minutes</p>
                </div>
            </div>
        </div>
    );
}
