import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone, Headset, X } from 'lucide-react';

export default function CustomerCare() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const fetchSupportConfig = async () => {
      try {
        const res = await fetch('/api/support');
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (err) {
        console.error('Failed to load support config:', err);
      }
    };
    fetchSupportConfig();
  }, []);

  if (!config) return null;

  const { whatsapp, calls } = config;

  // Don't render anything if both are disabled
  if ((!whatsapp || !whatsapp.enabled) && (!calls || !calls.enabled)) {
    return null;
  }

  const getWhatsAppLink = () => {
    if (whatsapp && whatsapp.number) {
      const text = encodeURIComponent(whatsapp.defaultMessage || 'Hello, I need help regarding my order/product.');
      return `https://wa.me/${whatsapp.number.replace(/[^0-9]/g, '')}?text=${text}`;
    }
    return '#';
  };

  const getCallLink = (number: string) => {
    const cleanNumber = number.replace(/[^\d+]/g, '');
    return `tel:${cleanNumber}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Menu */}
      {isOpen && (
        <div className="mb-4 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 w-72 animate-fade-in origin-bottom-right">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <Headset className="h-5 w-5 text-violet-600" />
              Customer Support
            </h4>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {whatsapp?.enabled && (
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-colors text-left"
              >
                <div className="bg-green-500 text-white p-2 rounded-lg shrink-0">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-green-900 text-sm">WhatsApp Support</p>
                  <p className="text-[10px] text-green-700 mt-0.5">Instant chat assistance</p>
                </div>
              </a>
            )}

            {calls?.enabled && calls.numbers && calls.numbers.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-bold text-slate-500 mb-2 px-1 uppercase tracking-wider">Call Centers</p>
                <div className="space-y-2">
                  {calls.numbers.map((num: string, idx: number) => (
                    <a
                      key={idx}
                      href={getCallLink(num)}
                      className="w-full flex items-center gap-3 p-3 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-colors text-left"
                    >
                      <div className="bg-violet-600 text-white p-2 rounded-lg shrink-0">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-violet-900 text-sm">Call Support {calls.numbers.length > 1 ? `#${idx + 1}` : ''}</p>
                        <p className="text-[11px] text-violet-700 mt-0.5 font-mono">{num}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen 
            ? 'h-12 w-12 rounded-full bg-slate-800 text-white shadow-slate-900/20' 
            : 'h-14 px-6 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-violet-600/30 font-bold gap-2'
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <Headset className="h-6 w-6" />
            <span className="text-sm">Help</span>
          </>
        )}
      </button>
    </div>
  );
}
