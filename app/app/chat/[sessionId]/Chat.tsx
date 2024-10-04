'use client'

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { logger } from 'filechat-shared/logger';

import type { ServerMessage } from '@/lib/MessageService';
import { MessageService } from '@/lib/MessageService';

interface Message {
  text: string,
  sender: 'user' | 'assistant'
};

export default function Chat({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { text: `Hello! I've got your files here, do you have any questions?`, sender: 'assistant' },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [chatInputDisabled, setChatInputDisabled] = useState<boolean>(false);
  const waitingForResponse = useRef<boolean>(false);
  const messageService = useRef<MessageService>(new MessageService());
  const scrollArea = useRef<HTMLDivElement>(null);

  const pushMessage = useCallback((message: Message): void => {
    setMessages(msgs => [...msgs, message]);
  }, [setMessages]);

  const popMessage = useCallback((): void => {
    setMessages(msgs => msgs.slice(0, -1));
  }, [setMessages]);

  const appendToLastMessage = useCallback((text: string): void => {
    setMessages(msgs => {
      if (msgs.length < 1) {
        return msgs;
      }
      return [
        ...msgs.slice(0, -1),
        {
          ...msgs.at(-1)!,
          text: msgs.at(-1)!.text + text
        }
      ];
    });
  }, [setMessages]);

  const onServerMessage = useCallback((msg: ServerMessage): void => {
    if (msg.error || msg.responseChunk) {
      if (waitingForResponse.current) {
        waitingForResponse.current = false;
        // Replace loading message with a new empty message to add to
        popMessage();
        pushMessage({ text: '', sender: 'assistant'});
      }
      if (msg.error) {
        logger.error(`Error from message handler: ${msg.error}`);
        appendToLastMessage('Sorry, I ran into an error. Try refreshing the page.');
      } else if (msg.responseChunk) {
        appendToLastMessage(msg.responseChunk);
      }
    } else if (msg.endResponse) {
      setChatInputDisabled(false);
    }
  }, [pushMessage, popMessage, appendToLastMessage, setChatInputDisabled]);

  // Message service connection handling
  useEffect(() => {

    const setup = async () => {
      await messageService.current.open(onServerMessage);
    };

    const teardown = async() => {
      await messageService.current.close();
    };

    // Setup and teardown on visibility change (avoid leaking connections on close)

    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        setup();
      } else if (document.visibilityState === 'hidden') {
        teardown();
      }
    };

    document.addEventListener('visibilitychange', visibilityHandler);

    // Setup and teardown on component load and unload

    setup();

    return () => {
        document.removeEventListener('visibilitychange', visibilityHandler);
        teardown();
    }
  }, [onServerMessage]);

  const handleSendMessage = () => {
    const msg = inputMessage.trim();
    if (msg !== '') {
      logger.info(`Sending message: ${msg}`);
      pushMessage({ text: msg, sender: 'user' });
      pushMessage({ text: 'Let me think...', sender: 'assistant' });
      setInputMessage('');
      setChatInputDisabled(true);
      waitingForResponse.current = true;

      (async () => {
        try {
          await messageService.current?.send(sessionId, msg);
        } catch (error) {
          logger.error('Error sending message.');
          logger.error(error);
          waitingForResponse.current = false;
          // Replace loading message with error message
          popMessage();
          pushMessage({ text: 'Sorry, I ran into an error. Try refreshing the page.', sender: 'assistant'});
        }
      })();
    }
  }

  // When the messages change, scroll to the bottom
  useEffect(() => {
    if (scrollArea.current) {
      scrollArea.current.scrollTo({
        top: scrollArea.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  return (
    <div className="w-screen h-dvh flex flex-col gap-4 items-center justify-center">
      <div className="size-full md:w-3/4 lg:w-1/2 md:h-3/4 border border-gray-200 md:rounded-lg overflow-hidden md:shadow-lg flex flex-col">
        <div className="bg-white p-4">
          <h2 className="text-lg font-semibold text-gray-800">File Chat</h2>
        </div>
        <ScrollArea viewportRef={scrollArea} className="flex-grow bg-gray-50">
          <div className="p-4">
            {messages.map((message, idx) => (
              <div
                key={ 'msg-' + idx }
                className={`mb-4 ${
                  message.sender === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block p-2 rounded-lg text-left max-w-64 md:max-w-96 ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex space-x-2">
            <Input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-grow text-base"
              disabled={chatInputDisabled}
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </div>
      </div>
    </div>
  )
};