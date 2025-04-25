'use client';

import { useState, useRef, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_CHATBOT_URL || 'http://localhost:5002/api';

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { 
            text: 'Hello! I\'m your exam assistant. How can I help you today?', 
            sender: 'bot' 
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!inputValue.trim()) return;
        
        // Add user message
        const userMessage = { text: inputValue, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        
        try {
            // Send request to chatbot API
            const response = await fetch(`${API_BASE_URL}/chatbot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: userMessage.text }),
            });
            
            const data = await response.json();
            
            // Add bot response
            const botMessage = { 
                text: data.success ? data.answer : 'Contact the administrator for more information.', 
                sender: 'bot',
                similarity: data.similarity,
                matchedQuestion: data.matched_question
            };
            
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error fetching chatbot response:', error);
            
            // Add error message
            const errorMessage = { 
                text: 'Sorry, I encountered an error. Please try again later.', 
                sender: 'bot',
                isError: true
            };
            
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Chatbot button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg flex items-center justify-center"
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}
            </button>
            
            {/* Chatbot window */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="bg-blue-500 text-white p-4">
                        <h3 className="font-medium">Exam Assistant</h3>
                    </div>
                    
                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto max-h-96 bg-gray-50">
                        {messages.map((message, index) => (
                            <div 
                                key={index} 
                                className={`mb-3 ${message.sender === 'user' ? 'text-right' : ''}`}
                            >
                                <div 
                                    className={`inline-block p-3 rounded-lg ${
                                        message.sender === 'user' 
                                            ? 'bg-blue-500 text-white' 
                                            : message.isError 
                                                ? 'bg-red-100 text-red-800' 
                                                : 'bg-gray-200 text-gray-800'
                                    } max-w-[80%]`}
                                >
                                    {message.text}
                                    {message.similarity && (
                                        <div className="text-xs mt-1 opacity-75">
                                            Match: {(message.similarity * 100).toFixed(1)}%
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-center space-x-2 mb-3">
                                <div className="bg-gray-200 p-3 rounded-lg">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Input */}
                    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 flex">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your question..."
                            className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg disabled:opacity-50"
                            disabled={isLoading || !inputValue.trim()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Chatbot; 