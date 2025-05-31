
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Send, RefreshCw } from 'lucide-react';
import type { ChatMessage, ChatSessionInfo } from '@/types';
import { getChatHistoryAction, sendChatMessageAction } from '@/lib/actions';
import { ChatMessageBubble } from './ChatMessageBubble';
import { useToast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
  sessionId: string;
  chatTitleProp?: string; // Optional initial title, can be updated from history
}

export function ChatInterface({ sessionId, chatTitleProp }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatSessionInfo, setChatSessionInfo] = useState<ChatSessionInfo | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchHistory = useCallback(async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setIsLoadingHistory(true);
    setError(null);
    try {
      const result = await getChatHistoryAction(sessionId);
      if (result.error || !result.history) {
        setError(result.error || "Failed to load chat history.");
        setMessages([]);
        setChatSessionInfo(null);
      } else {
        setMessages(result.history.messages);
        setChatSessionInfo(result.history.session);
      }
    } catch (e: any) {
      setError("An unexpected error occurred while fetching history: " + e.message);
      console.error(e);
    } finally {
      if (showLoadingSpinner) setIsLoadingHistory(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!inputValue.trim() || isSendingMessage) return;

    const optimisticUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticUserMessage]);
    setInputValue('');
    setIsSendingMessage(true);
    setError(null);

    try {
      const sendResult = await sendChatMessageAction(sessionId, optimisticUserMessage.content);
      if (sendResult.error || !sendResult.success) {
        setError(sendResult.error || "Failed to send message.");
        toast({ title: "Send Error", description: sendResult.error || "Could not send message.", variant: "destructive" });
        setMessages(prev => prev.filter(msg => msg.id !== optimisticUserMessage.id)); // Remove optimistic message
      } else {
        // Message sent, now fetch updated history to get model's response
        await fetchHistory(false); // Don't show main loading spinner for this refresh
      }
    } catch (sendError: any) {
      setError("An unexpected error occurred while sending message: " + sendError.message);
      toast({ title: "Error", description: "An unexpected error occurred: " + sendError.message, variant: "destructive" });
      setMessages(prev => prev.filter(msg => msg.id !== optimisticUserMessage.id)); // Remove optimistic message
    } finally {
      setIsSendingMessage(false);
    }
  };
  
  const currentChatTitle = chatSessionInfo?.title || chatTitleProp || "Chat";

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-medium truncate" title={currentChatTitle}>{currentChatTitle}</h3>
        <Button variant="ghost" size="icon" onClick={() => fetchHistory()} disabled={isLoadingHistory || isSendingMessage}>
          <RefreshCw className={`h-4 w-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {isLoadingHistory && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <Skeleton className="h-16 w-3/4 rounded-lg" />
              </div>
            ))}
          </div>
        )}
        {!isLoadingHistory && error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!isLoadingHistory && !error && messages.length === 0 && (
          <div className="text-center text-muted-foreground py-10">
            No messages yet. Start the conversation!
          </div>
        )}
        {!isLoadingHistory && !error && messages.length > 0 && (
          messages.map(msg => <ChatMessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isSendingMessage || isLoadingHistory}
            className="flex-1"
            aria-label="Chat message input"
          />
          <Button type="submit" disabled={isSendingMessage || isLoadingHistory || !inputValue.trim()}>
            {isSendingMessage ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
