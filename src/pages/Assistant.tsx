import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Send, Bot, User, MessageSquare, Loader2 } from 'lucide-react';

// Gemini replies use Markdown: show **bold** as bold and "* item" lines as bullets
const formatAssistantText = (text: string) =>
  text
    .replace(/^(\s*)[*-] /gm, '$1• ')
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith('**') && part.endsWith('**') && part.length > 4
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part
    );

export const Assistant = () => {
  const location = useLocation();
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pre-fill input if navigated with context_exercise
  useEffect(() => {
    if (location.state?.context_exercise) {
      setInput(`Can you explain how I should perform ${location.state.context_exercise}?`);
      // Optionally auto-send or let user hit send
    }
  }, [location.state]);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/chat/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        if (data.length > 0 && !activeSessionId) {
          loadSession(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const loadSession = async (sessionId: number) => {
    setActiveSessionId(sessionId);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/chat/sessions/${sessionId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        scrollToBottom();
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const createNewSession = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/chat/sessions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const newSession = await res.json();
        setSessions([newSession, ...sessions]);
        setActiveSessionId(newSession.id);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    let currentSessionId = activeSessionId;
    
    // If no active session, create one first
    if (!currentSessionId) {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/chat/sessions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const newSession = await res.json();
      setSessions([newSession, ...sessions]);
      currentSessionId = newSession.id;
      setActiveSessionId(newSession.id);
    }

    const newMessageText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: newMessageText, sources: [] }]);
    setIsLoading(true);
    scrollToBottom();

    const token = localStorage.getItem('token');
    try {
      const payload: any = { content: newMessageText };
      if (location.state?.context_exercise) {
         payload.context_exercise = location.state.context_exercise;
      }
        
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/chat/sessions/${currentSessionId}/message`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data]);
        // Refresh sessions to get updated title
        fetchSessions();
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', sources: [] }]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Is the backend running?', sources: [] }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
      
      {/* Sidebar - Sessions */}
      <div className="w-full md:w-64 flex flex-col gap-4">
        <button 
          onClick={createNewSession}
          className="w-full py-3 bg-[#00806E] text-white rounded-xl font-medium hover:bg-[#006B5C] transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <MessageSquare className="w-4 h-4" />
          New Chat
        </button>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {sessions.map(s => (
            <div 
              key={s.id} 
              onClick={() => loadSession(s.id)}
              className={`p-3 rounded-xl cursor-pointer transition-colors text-sm truncate ${activeSessionId === s.id ? 'bg-blue-50 border-blue-200 border text-blue-700 font-medium' : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'}`}
            >
              {s.title}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden border-gray-200/60">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gray-50/50">
          
          {messages.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-4">
               <MessageSquare className="w-10 h-10 text-gray-300" aria-hidden="true" />
               <p>Ask about your posture checks, exercises or progress. The assistant explains; it doesn't diagnose, and it isn't a physiotherapist.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex items-start max-w-3xl ${msg.role === 'user' ? 'justify-end ml-auto' : ''}`}>
              
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-[#00806E] flex items-center justify-center shrink-0 shadow-sm mr-4">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div className={`p-4 rounded-2xl shadow-sm text-sm md:text-base ${
                msg.role === 'user' 
                  ? 'bg-[#00806E] text-white rounded-tr-sm' 
                  : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm md:prose-base max-w-none whitespace-pre-wrap">
                    {formatAssistantText(msg.content)}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
                
                {/* Citations/Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2 font-medium">SOURCES:</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((src: string, idx: number) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-gray-50 border border-gray-200 rounded text-gray-500">
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 ml-4">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start max-w-3xl">
              <div className="w-8 h-8 rounded-full bg-[#00806E] flex items-center justify-center shrink-0 shadow-sm mr-4">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto flex items-end space-x-2">
            <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-2 md:py-3 focus-within:ring-2 focus-within:ring-[#00806E] focus-within:border-transparent transition-all shadow-inner flex items-center">
              <textarea 
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your posture, exercises or progress" aria-label="Message"
                className="w-full bg-transparent resize-none focus:outline-none text-gray-700 placeholder-gray-400 py-1"
                style={{ minHeight: '28px', maxHeight: '120px' }}
              />
            </div>
            <button 
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              aria-label="Send"
              className="p-3 bg-[#00806E] text-white rounded-full hover:bg-[#006B5C] transition-colors shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 ml-0.5" aria-hidden="true" />
            </button>
          </div>
          
          <div className="max-w-4xl mx-auto mt-4 flex flex-wrap gap-2 justify-center">
             <button type="button" onClick={() => setInput("Suggest desk exercises")} className="text-[13px] px-3 py-1.5 bg-white border border-rule rounded-[6px] text-ink hover:border-ink">Suggest desk exercises</button>
             <button type="button" onClick={() => setInput("What does my latest posture check mean?")} className="text-[13px] px-3 py-1.5 bg-white border border-rule rounded-[6px] text-ink hover:border-ink">Explain my last check</button>
             <button type="button" onClick={() => setInput("How can I sit better while studying?")} className="text-[13px] px-3 py-1.5 bg-white border border-rule rounded-[6px] text-ink hover:border-ink">How can I sit better while studying?</button>
          </div>
        </div>
      </Card>
    </div>
  );
};
