import React, { useState, useEffect, useRef } from 'react';

function Chat({ apiUrl, onCancel }) {
  // --- Existing State ---
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // --- Refactored State for Dragging ---
  const [isDragging, setIsDragging] = useState(false);
  // Position now represents top/left coordinates
  const [position, setPosition] = useState({ x: window.innerWidth - 404, y: window.innerHeight - 500 }); // Initial position guess
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const chatWindowRef = useRef(null);

  // --- Drag Handlers with Boundary Checks ---
  const handleMouseDown = (e) => {
    setIsDragging(true);
    // Calculate offset from the top-left corner of the element
    const chatRect = chatWindowRef.current.getBoundingClientRect();
    setOffset({
      x: e.clientX - chatRect.left,
      y: e.clientY - chatRect.top,
    });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const chatRect = chatWindowRef.current.getBoundingClientRect();
      const headerHeight = 40; // Approximate height of the header to keep it in view

      // Calculate potential new position
      let newX = e.clientX - offset.x;
      let newY = e.clientY - offset.y;

      // Clamp position to stay within viewport boundaries
      const minX = 0;
      const minY = 0;
      const maxX = window.innerWidth - chatRect.width;
      const maxY = window.innerHeight - headerHeight; // Ensure header is always accessible

      newX = Math.max(minX, Math.min(newX, maxX));
      newY = Math.max(minY, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Effect to add/remove global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);


  // --- Existing Logic ---
  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { text: input, sender: 'user' }];
    setMessages(newMessages); setInput(''); setIsLoading(true);
    fetch(`${apiUrl}/chat/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: input }), })
    .then(res => res.ok ? res.json() : Promise.reject('Failed to get response'))
    .then(data => { setMessages([...newMessages, { text: data.response, sender: 'ai' }]); })
    .catch(err => { setMessages([...newMessages, { text: 'Sorry, I had trouble getting a response.', sender: 'ai' }]); })
    .finally(() => setIsLoading(false));
  };

  return (
    <div
      ref={chatWindowRef}
      className="fixed w-96 bg-white shadow-2xl rounded-lg flex flex-col max-h-[70vh] z-50"
      // Updated style to use top/left
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
    >
      <div
        className="p-4 border-b flex justify-between items-center flex-shrink-0 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 text-2xl leading-none cursor-pointer">&times;</button>
      </div>
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
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ask about your finances..." disabled={isLoading} />
        <button onClick={handleSend} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:bg-blue-300">Send</button>
      </div>
    </div>
  );
}

export default Chat;