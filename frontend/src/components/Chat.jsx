import React, { useState, useEffect, useRef } from 'react';

function Chat({ apiUrl, onCancel }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { text: input, sender: 'user' }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    fetch(`${apiUrl}/chat/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: input }),
    })
    .then(res => res.ok ? res.json() : Promise.reject('Failed to get response'))
    .then(data => {
      setMessages([...newMessages, { text: data.response, sender: 'ai' }]);
    })
    .catch(err => {
      setMessages([...newMessages, { text: 'Sorry, I had trouble getting a response.', sender: 'ai' }]);
    })
    .finally(() => setIsLoading(false));
  };

  return (
    <div className="fixed bottom-5 right-5 w-96 bg-white shadow-2xl rounded-lg flex flex-col max-h-[70vh]">
      <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
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
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ask about your finances..."
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:bg-blue-300">Send</button>
      </div>
    </div>
  );
}

export default Chat;