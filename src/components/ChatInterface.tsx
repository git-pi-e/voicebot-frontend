// @/components/ChatInterface.tsx
"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import AudioRecorder from '@/components/ui/AudioRecorder';
import { Input } from "@/components/ui/input"

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false); // State to handle processing

  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref to the last message element

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }; // Scroll to the bottom of the chat window

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Scroll to the bottom when a new message is added

  const handleSendMessage = () => {
    if (inputText.trim()) {
      setMessages([...messages, { sender: 'user', text: inputText }]);
      setInputText('');

      // Simulate AI response (replace with actual API call in production)
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

  const handleProcessingState = (state: boolean) => {
    setIsProcessing(state);
  };

  return (
    <div className="flex flex-col flex-grow md:container md:mx-auto p-4 bg-gray-800 text-white rounded overflow-hidden">

      <div className="flex-grow overflow-y-auto p-2 border border-gray-700 rounded">
        {messages.map((message, index) => (
          <div key={index} className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-4 py-2 rounded ${message.sender === 'user' ? 'bg-blue-500' : 'bg-gray-700'}`}>
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* <div className="mt-4 flex flex-row">
        <Input
          type="text"
          placeholder='Type a message OR speak and click "Send" to send an audio message.'
          className="flex-1 px-4 py-2 mr-4 bg-gray-900 text-white border border-gray-700 rounded-xl"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={isProcessing} // Disable input during processing
        />
        <Button
          onClick={handleSendMessage}
          className="px-4 py-2 rounded-md h-9"
          variant="secondary"
          disabled={isProcessing} // Disable button during processing
        >
          Send
        </Button>
      </div> */}

      <AudioRecorder
        onMessageReceived={handleMessageReceived}
        onProcessing={handleProcessingState} // Handle processing state
      />

    </div>
  );
};

export default ChatInterface;
