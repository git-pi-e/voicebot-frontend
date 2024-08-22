// @/components/ChatInterface.tsx
"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import AudioRecorder from './ui/AudioRecorder';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = () => {
    if (inputText.trim()) {
      setMessages([...messages, { sender: 'user', text: inputText }]);
      setInputText('');

      // Simulate AI response (replace with WebSocket message in production)
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: 'This is a simulated response from the AI.' },
        ]);
      }, 1000);
    }
  };

  const handleMessageReceived = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  return (
    <div className="md:container md:mx-auto p-4 bg-gray-800 text-white rounded">
      <div className="overflow-y-auto h-96 p-2 border border-gray-700 rounded">
        {messages.map((message, index) => (
          <div key={index} className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-4 py-2 rounded ${message.sender === 'user' ? 'bg-blue-500' : 'bg-gray-700'}`}>
              {message.text}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-row">
        <input
          type="text"
          placeholder='Type a message OR speak and click "Send" to send an audio message.'
          className="flex-1 px-4 py-2 mr-4 bg-gray-900 text-white border border-gray-700 rounded-xl"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button
          onClick={handleSendMessage}
          className="px-4 py-2"
          variant="secondary"
        >
          Send
        </Button>
      </div>
      <AudioRecorder onMessageReceived={handleMessageReceived} />
    </div>
  );
};

export default ChatInterface;
