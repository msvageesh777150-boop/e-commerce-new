import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, X, Mic, Send, MessageCircle, Phone, Sparkles, History, Trash2, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  audioBase64?: string;
  timestamp: string;
};

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    role: 'model',
    content: "Hi there! I'm Omni AI. How can I help you with your shopping today?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const [supportConfig, setSupportConfig] = useState<any>(null);

  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyMode, setHistoryMode] = useState(false);
  const [historicalSessions, setHistoricalSessions] = useState<{id: string, title: string, date: string, msgs: Message[]}[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/support')
      .then(res => res.json())
      .then(data => setSupportConfig(data))
      .catch(console.error);
  }, []);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem('omni_token');
      if (token) {
        const res = await fetch('/api/ai/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.sessions && data.sessions.length > 0) {
          // Break history into sessions
          setHistoricalSessions(data.sessions.map((s: any) => ({
            id: s.id,
            title: s.title || `Chat Session`,
            date: s.date ? new Date(s.date).toLocaleString() : new Date().toLocaleString(),
            msgs: s.messages || []
          })));
          setHistoryMode(true);
        } else {
          alert('No past conversations found.');
        }
      } else {
        alert('Please log in to view chat history.');
      }
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('omni_token');
      await fetch(`/api/ai/history/${sessionId}`, {
        method: 'DELETE',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      setHistoricalSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([{
          id: '1', role: 'model', content: "Hi there! I'm Omni AI. How can I help you with your shopping today?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (error) {
      console.error('Failed to delete session', error);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setHistoryMode(false);
    setMessages([{
      id: '1', role: 'model', content: "Hi there! I'm Omni AI. How can I help you with your shopping today?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('omni_token');
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await res.json();
      if (data.sessionId) setCurrentSessionId(data.sessionId);
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: data.message || "I'm having a little trouble connecting. Need human support?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I seem to have lost my connection. Would you like to speak to our human support team?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = async () => {
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new (window as any).MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e: any) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          handleVoiceSend(base64Audio);
        };
        stream.getTracks().forEach((track: any) => track.stop());
      };

      setIsListening(true);
      mediaRecorder.start();
    } catch (e) {
      console.error("Microphone access denied", e);
      alert("Microphone access denied or not supported.");
    }
  };

  const handleVoiceSend = async (base64Audio: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: '', // Will be transcribed on the backend
      audioBase64: base64Audio,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const token = localStorage.getItem('omni_token');
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
            audioBase64: m.id === userMessage.id ? m.audioBase64 : undefined
          }))
        })
      });

      const data = await res.json();
      if (data.sessionId) setCurrentSessionId(data.sessionId);
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: data.message || "I'm having a little trouble connecting. Need human support?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I seem to have lost my connection. Would you like to speak to our human support team?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const isSupportNeeded = messages.length > 3 && messages[messages.length - 1].content.toLowerCase().includes('human support');

  return (
    <div className="relative z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-indigo-100 flex flex-col overflow-hidden w-[350px] sm:w-[400px] max-h-[600px] h-[80vh]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white flex justify-between items-center shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-md">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Omni AI</h3>
                  <p className="text-xs text-indigo-100 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={loadHistory} disabled={isLoadingHistory} className="hover:bg-white/20 p-2 rounded-full transition-colors group relative" title="Load Chat History">
                  <History className={`h-5 w-5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  <span className="absolute -bottom-8 right-0 text-[10px] bg-slate-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Load History</span>
                </button>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {historyMode ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Conversations</h4>
                    <button onClick={startNewChat} className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:bg-indigo-50 px-2 py-1 rounded transition-colors">
                      <PlusCircle className="h-3 w-3" /> New
                    </button>
                  </div>
                  {historicalSessions.map((session) => (
                    <div 
                      key={session.id}
                      onClick={() => {
                        setCurrentSessionId(session.id);
                        setMessages(session.msgs);
                        setHistoryMode(false);
                      }}
                      className={`w-full text-left p-4 bg-white border ${currentSessionId === session.id ? 'border-indigo-400 ring-1 ring-indigo-400/20' : 'border-slate-200'} rounded-xl shadow-sm hover:border-indigo-400 transition-colors flex items-center justify-between cursor-pointer group`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-indigo-50 text-indigo-500 rounded-full shrink-0">
                          <MessageCircle className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-sm font-bold text-slate-700 truncate">{session.title}</span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">{session.date} • {session.msgs.length} messages</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => deleteSession(e, session.id)} 
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Conversation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {historicalSessions.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">No saved conversations.</div>
                  )}
                  <button 
                    onClick={() => setHistoryMode(false)}
                    className="w-full text-center p-3 text-sm text-slate-500 hover:bg-slate-200 rounded-xl transition-colors mt-2 font-medium"
                  >
                    Go Back to Chat
                  </button>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-800' : 'bg-indigo-600'}`}>
                    {msg.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
                  </div>
                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                      msg.role === 'user' 
                        ? 'bg-slate-800 text-white rounded-tr-none' 
                        : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none prose prose-sm prose-indigo'
                    }`}>
                      {msg.audioBase64 && (
                        <div className="mb-2 bg-slate-700/50 p-1.5 rounded-xl inline-block shadow-inner">
                           <audio controls src={msg.audioBase64} className="h-8 w-[200px] max-w-full outline-none" />
                        </div>
                      )}
                      {msg.role === 'user' ? (msg.content || (msg.audioBase64 ? '🎤 Voice Message' : '')) : (
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({node, href, ...props}) => {
                              if (href?.startsWith('/product/')) {
                                const productId = href.split('/')[2];
                                return (
                                  <button 
                                    onClick={() => {
                                      window.dispatchEvent(new CustomEvent('NAVIGATE_TO_PRODUCT', { detail: productId }));
                                    }}
                                    className="text-indigo-600 font-semibold underline cursor-pointer"
                                  >
                                    {props.children}
                                  </button>
                                );
                              }
                              return <a href={href} {...props} className="text-indigo-600 font-semibold underline" target="_blank" />
                            },
                            img: ({node, ...props}) => <img {...props} className="rounded-lg mt-2 max-w-full h-auto border border-slate-200 shadow-sm" />
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center shadow-sm">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}

              {/* Fallback Support UI */}
              {isSupportNeeded && supportConfig && (
                <div className="mt-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Contact Human Support</p>
                  {supportConfig.whatsapp?.enabled && (
                    <a href={`https://wa.me/${supportConfig.whatsapp.number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-900 transition-colors">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-bold">WhatsApp Us</span>
                    </a>
                  )}
                  {supportConfig.calls?.enabled && supportConfig.calls.numbers?.[0] && (
                    <a href={`tel:${supportConfig.calls.numbers[0]}`} className="flex items-center gap-3 p-3 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg text-violet-900 transition-colors">
                      <Phone className="h-5 w-5 text-violet-600" />
                      <span className="text-sm font-bold">Call Us</span>
                    </a>
                  )}
                </div>
              )}
              
              <div ref={messagesEndRef} />
              </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-slate-100">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full p-1 shadow-inner">
                <button 
                  onClick={toggleVoice}
                  className={`p-2.5 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'hover:bg-slate-200 text-slate-500'}`}
                >
                  <Mic className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 text-slate-700 placeholder:text-slate-400 outline-none"
                  disabled={isListening}
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen 
            ? 'h-14 w-14 rounded-full bg-slate-800 text-white shadow-slate-900/20' 
            : 'h-14 px-6 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-600/30 font-bold gap-2'
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <Sparkles className="h-6 w-6 animate-pulse" />
            <span className="text-sm">AI Chat</span>
          </>
        )}
      </button>
    </div>
  );
}
