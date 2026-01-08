import { X, MessageSquare, Car, DoorOpen, PhoneMissed, Edit3 } from 'lucide-react';
import { useState } from 'react';

interface QuickMessageProps {
    customerName: string;
    customerPhone: string;
    onClose: () => void;
}

const messageTemplates = [
    {
        id: 'on_way',
        icon: Car,
        label: 'On my way',
        message: 'Hello! I am on my way with your PathXpress delivery. I will arrive in approximately 5-10 minutes.',
        color: 'bg-blue-100',
        iconColor: 'text-blue-600',
    },
    {
        id: 'at_door',
        icon: DoorOpen,
        label: 'At the door',
        message: 'Hello! I am at your door with your PathXpress delivery. Please come to receive your package.',
        color: 'bg-green-100',
        iconColor: 'text-green-600',
    },
    {
        id: 'no_response',
        icon: PhoneMissed,
        label: 'No response',
        message: 'Hello! I tried to deliver your PathXpress package but could not reach you. Please call me back or let me know when you are available.',
        color: 'bg-orange-100',
        iconColor: 'text-orange-600',
    },
    {
        id: 'custom',
        icon: Edit3,
        label: 'Custom message',
        message: '',
        color: 'bg-gray-100',
        iconColor: 'text-gray-600',
    },
];

export function QuickMessage({ customerName, customerPhone, onClose }: QuickMessageProps) {
    const [customMessage, setCustomMessage] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    const formatPhoneForWhatsApp = (phone: string): string => {
        // Remove all non-numeric characters except +
        let cleaned = phone.replace(/[^\d+]/g, '');

        // If starts with +, remove it (WhatsApp API doesn't need it)
        if (cleaned.startsWith('+')) {
            cleaned = cleaned.substring(1);
        }

        // If starts with 00, remove it
        if (cleaned.startsWith('00')) {
            cleaned = cleaned.substring(2);
        }

        // If it's a UAE number without country code, add 971
        if (cleaned.startsWith('0')) {
            cleaned = '971' + cleaned.substring(1);
        }

        // If it's a short number (no country code), assume UAE
        if (cleaned.length <= 10) {
            cleaned = '971' + cleaned;
        }

        return cleaned;
    };

    const sendMessage = (message: string) => {
        if (!message.trim()) return;

        const formattedPhone = formatPhoneForWhatsApp(customerPhone);
        const encodedMessage = encodeURIComponent(message);

        // Try WhatsApp first (works on mobile)
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
        onClose();
    };

    const handleTemplateClick = (template: typeof messageTemplates[0]) => {
        if (template.id === 'custom') {
            setShowCustomInput(true);
        } else {
            sendMessage(template.message);
        }
    };

    const handleSendCustom = () => {
        if (customMessage.trim()) {
            sendMessage(customMessage);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end">
            <div className="w-full bg-white rounded-t-[2rem] p-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-gray-900">Quick Message</h3>
                        <p className="text-sm text-gray-500">{customerName}</p>
                    </div>
                    <div className="w-10" />
                </div>

                {!showCustomInput ? (
                    /* Template Selection */
                    <div className="space-y-3">
                        {messageTemplates.map((template) => {
                            const Icon = template.icon;
                            return (
                                <button
                                    key={template.id}
                                    onClick={() => handleTemplateClick(template)}
                                    className="w-full p-4 rounded-2xl border border-gray-100 bg-white flex items-center gap-4 hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    <div className={`w-12 h-12 rounded-xl ${template.color} flex items-center justify-center`}>
                                        <Icon className={`w-6 h-6 ${template.iconColor}`} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="font-bold text-gray-900">{template.label}</h4>
                                        {template.message && (
                                            <p className="text-sm text-gray-500 line-clamp-1">{template.message}</p>
                                        )}
                                    </div>
                                    <MessageSquare className="w-5 h-5 text-green-500" />
                                </button>
                            );
                        })}

                        {/* WhatsApp Branding */}
                        <div className="flex items-center justify-center gap-2 pt-4">
                            <span className="text-xs text-gray-400">Opens in</span>
                            <div className="flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full">
                                <span className="text-green-600 text-sm">💬 WhatsApp</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Custom Message Input */
                    <div className="space-y-4">
                        <button
                            onClick={() => setShowCustomInput(false)}
                            className="text-sm text-gray-500 underline"
                        >
                            ← Back to templates
                        </button>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Your message to {customerName}
                            </label>
                            <textarea
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                placeholder="Type your message here..."
                                className="w-full p-4 border border-gray-200 rounded-2xl resize-none h-32 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                autoFocus
                            />
                        </div>

                        <button
                            onClick={handleSendCustom}
                            disabled={!customMessage.trim()}
                            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${customMessage.trim()
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <MessageSquare className="w-5 h-5" />
                            Send via WhatsApp
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
