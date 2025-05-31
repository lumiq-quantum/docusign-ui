
"use client";

import type { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Bot } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';
  
  let dateToFormat: Date | null = null;
  if (message.timestamp && typeof message.timestamp === 'string') {
    // Check if the timestamp string already includes timezone information (Z or +/-HH:MM)
    if (message.timestamp.endsWith('Z') || /[\+\-]\d{2}:\d{2}$/.test(message.timestamp) || /[\+\-]\d{2}\d{2}$/.test(message.timestamp)) {
      dateToFormat = new Date(message.timestamp);
    } else {
      // If no timezone info, assume it's UTC and append 'Z'
      dateToFormat = new Date(message.timestamp + 'Z');
    }
  }

  const timestamp = dateToFormat
    ? formatDistanceToNow(dateToFormat, { addSuffix: true })
    : '';

  return (
    <div
      className={cn(
        "flex items-start gap-3 mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 border">
          <AvatarFallback>
            <Bot className="h-5 w-5 text-primary" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[75%] rounded-lg p-3 shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground border"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {message.file_uri && (
          <a 
            href={message.file_uri} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={cn(
              "text-xs mt-1 block hover:underline",
              isUser ? "text-primary-foreground/80" : "text-accent hover:text-accent/80"
            )}
          >
            Attached file ({message.file_mime_type || 'unknown type'})
          </a>
        )}
        <p
          className={cn(
            "text-xs mt-1",
            isUser ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"
          )}
          title={dateToFormat ? dateToFormat.toLocaleString() : message.timestamp} // Show full date on hover
        >
          {timestamp}
        </p>
      </div>
      {isUser && (
         <Avatar className="h-8 w-8 border">
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
