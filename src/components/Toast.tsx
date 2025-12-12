import { useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
    duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-5 h-5" />,
        error: <AlertCircle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />
    };

    const colors = {
        success: 'from-green-500 to-emerald-600',
        error: 'from-red-500 to-rose-600',
        info: 'from-blue-500 to-indigo-600'
    };

    return (
        <div className="fixed top-20 right-6 z-50 animate-slide-in-right">
            <div className={`bg-gradient-to-r ${colors[type]} text-white rounded-lg shadow-2xl p-4 pr-12 min-w-[300px] max-w-md`}>
                <div className="flex items-center gap-3">
                    {icons[type]}
                    <p className="font-medium">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
