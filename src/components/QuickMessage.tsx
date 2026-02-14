import { useState } from 'react';

interface QuickMessageProps {
    customerName: string;
    customerPhone: string;
    onClose: () => void;
}

const messageTemplates = [
    {
        id: 'on_way',
        icon: 'local_shipping',
        label: 'On my way',
        message: 'Hello! I am on my way with your PathXpress delivery. I will arrive in approximately 30 minutes.',
        color: 'bg-blue-500/20',
        iconColor: 'text-blue-400',
    },
    {
        id: 'share_location',
        icon: 'location_on',
        label: 'Request location',
        message: 'Hello! I am your PathXpress driver. Could you please share your location pin on WhatsApp so I can find you easily? Just tap the + button, select Location, and send your pin. Thank you!',
        color: 'bg-purple-500/20',
        iconColor: 'text-purple-400',
    },
    {
        id: 'at_door',
        icon: 'door_front',
        label: 'At the door',
        message: 'Hello! I am at your door with your PathXpress delivery. Please come to receive your package.',
        color: 'bg-green-500/20',
        iconColor: 'text-green-400',
    },
    {
        id: 'no_response',
        icon: 'phone_missed',
        label: 'No response',
        message: 'Hello! I tried to deliver your PathXpress package but could not reach you. Please call me back or let me know when you are available.',
        color: 'bg-orange-500/20',
        iconColor: 'text-orange-400',
    },
    {
        id: 'custom',
        icon: 'edit',
        label: 'Custom message',
        message: '',
        color: 'bg-gray-700',
        iconColor: 'text-gray-400',
    },
];

export function QuickMessage({ customerName, customerPhone, onClose }: QuickMessageProps) {
    const [customMessage, setCustomMessage] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    const formatPhoneForWhatsApp = (phone: string): string => {
        let cleaned = phone.replace(/[^\d+]/g, '');
        if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
        if (cleaned.startsWith('00')) cleaned = cleaned.substring(2);
        if (cleaned.startsWith('0')) cleaned = '971' + cleaned.substring(1);
        if (cleaned.length <= 10) cleaned = '971' + cleaned;
        return cleaned;
    };

    const sendMessage = (message: string) => {
        if (!message.trim()) return;
        const formattedPhone = formatPhoneForWhatsApp(customerPhone);
        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
        onClose();
    };

    const handleTemplateClick = (template: typeof messageTemplates[0]) => {
        if (template.id === 'custom') setShowCustomInput(true);
        else sendMessage(template.message);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end">
            <div className="w-full bg-background rounded-t-3xl p-5 pb-[calc(2rem+env(safe-area-inset-bottom))] border-t border-gray-800/50">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-surface-dark flex items-center justify-center border border-gray-800/50">
                        <span className="material-symbols-rounded text-gray-400 text-xl">close</span>
                    </button>
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-foreground">Quick Message</h3>
                        <p className="text-xs text-gray-500">{customerName}</p>
                    </div>
                    <div className="w-10" />
                </div>

                {!showCustomInput ? (
                    <div className="space-y-2">
                        {messageTemplates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => handleTemplateClick(template)}
                                className="w-full p-3.5 rounded-xl border border-gray-800/50 bg-card flex items-center gap-3 hover:bg-surface-darker transition-all active:scale-[0.98]"
                            >
                                <div className={`w-10 h-10 rounded-lg ${template.color} flex items-center justify-center`}>
                                    <span className={`material-symbols-rounded ${template.iconColor} text-xl`}>{template.icon}</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <h4 className="font-bold text-foreground text-sm">{template.label}</h4>
                                    {template.message && (
                                        <p className="text-xs text-gray-500 line-clamp-1">{template.message}</p>
                                    )}
                                </div>
                                <span className="material-symbols-rounded text-green-500 text-lg">send</span>
                            </button>
                        ))}

                        <div className="flex items-center justify-center gap-2 pt-3">
                            <span className="text-[10px] text-gray-600">Opens in</span>
                            <div className="flex items-center gap-1 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                                <span className="text-green-400 text-xs font-medium">WhatsApp</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <button onClick={() => setShowCustomInput(false)} className="text-xs text-gray-500 underline">
                            ← Back to templates
                        </button>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">
                                Your message to {customerName}
                            </label>
                            <textarea
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                placeholder="Type your message here..."
                                className="w-full p-4 border border-gray-800/50 bg-card rounded-xl resize-none h-32 text-foreground placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500/30 focus:border-green-500/30"
                                autoFocus
                            />
                        </div>

                        <button
                            onClick={() => { if (customMessage.trim()) sendMessage(customMessage); }}
                            disabled={!customMessage.trim()}
                            className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${customMessage.trim() ? 'bg-green-600 text-white active:scale-[0.98]' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            <span className="material-symbols-rounded text-xl">send</span>
                            Send via WhatsApp
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
