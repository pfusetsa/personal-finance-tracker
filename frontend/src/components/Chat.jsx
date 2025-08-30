import React, { useState, useEffect, useRef } from 'react';

function Chat({ apiUrl, onCancel, t }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { text: input, sender: 'user' }];
    setMessages(newMessages); setInput(''); setIsLoading(true);
    fetch(`${apiUrl}/chat/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: input, history: messages }), })
    .then(res => res.ok ? res.json() : Promise.reject('Failed to get response'))
    .then(data => { setMessages([...newMessages, { text: data.response, sender: 'ai' }]); })
    .catch(err => { setMessages([...newMessages, { text: 'Sorry, I had trouble getting a response.', sender: 'ai' }]); })
    .finally(() => setIsLoading(false));
  };

  // If minimized, show a small header bar instead of a bubble
  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-0 left-8 bg-white shadow-2xl rounded-t-lg flex items-center justify-between p-3 w-80 z-50 cursor-pointer hover:bg-gray-50"
      >
        <h2 className="text-lg font-semibold text-gray-800">{t.aiAssistant}</h2>
        <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
        </div>
      </div>
    );
  }

  // Full chat window, now positioned bottom-left
  return (
    <div
      className="fixed bottom-8 left-8 w-96 bg-white shadow-2xl rounded-lg flex flex-col max-h-[70vh] z-50"
    >
      <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg font-semibold">{t.aiAssistant}</h2>
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsMinimized(true)} className="text-gray-500 hover:text-gray-800" title="Minimize">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
          </button>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 text-2xl leading-none cursor-pointer" title="Close">&times;</button>
        </div>
      </div>
      {/* ... rest of the component is the same ... */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={`my-2 p-3 rounded-lg max-w-xs ${msg.sender === 'user' ? 'bg-blue-500 text-white ml-auto' : 'bg-gray-200 text-gray-800'}`}>
            {msg.text}
          </div>
        ))}
        {isLoading && <div className="text-center p-2">AI is thinking...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t flex flex-shrink-0">
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} className="flex-1 p-2 border rounded-l-lg" placeholder={t.askAIPlaceholder} disabled={isLoading} />
        <button onClick={handleSend} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:bg-blue-300">Send</button>
      </div>
    </div>
  );
}

export default Chat;