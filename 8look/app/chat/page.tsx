'use client';

import { Client, type IMessage } from '@stomp/stompjs';
import { Send } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import SockJS from 'sockjs-client';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SiteHeader, { defaultAvatarUrl, HeaderSearch } from '../components/SiteHeader';
import { useAuth } from '@/lib/auth';
import { formatMessageTime } from '@/lib/format';
import styles from './chat.module.css';

type ChatMessage = {
  id?: number;
  chatId?: string;
  senderId: number;
  recipientId: number;
  content: string;
  timestamp?: string;
};

type ChatConfig = {
  socketUrl: string;
};

type ChatConversation = {
  userId: number;
  username: string;
  avatarUrl?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
};

export default function ChatPage() {
  const { user, isLoadingUser } = useAuth();
  const searchParams = useSearchParams();
  const initialRecipientId = searchParams.get('recipientId') ?? '';
  const initialRecipientName = searchParams.get('recipientName') ?? '';
  const [recipientId, setRecipientId] = useState<number | null>(() => {
    const parsed = Number(initialRecipientId);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  });
  const [recipientName, setRecipientName] = useState(initialRecipientName);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [draft, setDraft] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const clientRef = useRef<Client | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const activeRecipientRef = useRef<number | null>(recipientId);

  const title = useMemo(() => {
    if (recipientName.trim()) return recipientName.trim();
    if (recipientId) return `User ${recipientId}`;
    return 'Select a conversation';
  }, [recipientId, recipientName]);

  const loadConversations = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch('/api/conversations', {
        cache: 'no-store',
        signal,
      });

      if (!response.ok) throw new Error('Unable to load conversations.');

      const loadedConversations = await response.json() as ChatConversation[];
      setConversations(loadedConversations);

      const activeRecipient = activeRecipientRef.current;
      if (activeRecipient === null && loadedConversations.length > 0) {
        const latestConversation = loadedConversations[0];
        activeRecipientRef.current = latestConversation.userId;
        setRecipientId(latestConversation.userId);
        setRecipientName(latestConversation.username);
        return;
      }

      const activeConversation = loadedConversations.find((conversation) => conversation.userId === activeRecipient);
      if (activeConversation) {
        setRecipientName(activeConversation.username);
      }
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
      setError(requestError instanceof Error ? requestError.message : 'Unable to load conversations.');
    }
  }, []);

  useEffect(() => {
    activeRecipientRef.current = recipientId;
  }, [recipientId]);

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadConversations(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadConversations, user]);

  useEffect(() => {
    if (!user) return;

    let disposed = false;

    fetch('/api/chat/config', { cache: 'no-store' })
      .then((response) => response.json() as Promise<ChatConfig>)
      .then((config) => {
        if (disposed) return;

        const client = new Client({
          reconnectDelay: 3000,
          webSocketFactory: () => new SockJS(config.socketUrl),
          onConnect: () => {
            if (disposed) return;
            setIsConnected(true);
            client.subscribe(`/topic/messages/${user.id}`, (frame: IMessage) => {
              const incoming = JSON.parse(frame.body) as ChatMessage;
              const activeRecipient = activeRecipientRef.current;
              const belongsToActiveConversation = activeRecipient !== null
                && (incoming.senderId === activeRecipient || incoming.recipientId === activeRecipient);

              if (belongsToActiveConversation) {
                setMessages((currentMessages) => {
                  if (incoming.id && currentMessages.some((message) => message.id === incoming.id)) {
                    return currentMessages;
                  }
                  return [...currentMessages, incoming];
                });
              }

              void loadConversations();
            });
          },
          onDisconnect: () => {
            if (!disposed) setIsConnected(false);
          },
          onStompError: () => setError('Live chat connection failed.'),
          onWebSocketClose: () => {
            if (!disposed) setIsConnected(false);
          },
        });

        clientRef.current = client;
        client.activate();
      })
      .catch(() => {
        if (!disposed) {
          setError('Live chat connection failed.');
          setIsConnected(false);
        }
      });

    return () => {
      disposed = true;
      setIsConnected(false);
      const client = clientRef.current;
      if (client) {
        void client.deactivate().then(() => {
          if (clientRef.current === client) clientRef.current = null;
        });
      }
    };
  }, [loadConversations, user]);

  useEffect(() => {
    if (!recipientId || !user) return;

    const controller = new AbortController();
    fetch(`/api/messages/${recipientId}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load messages.');
        return response.json() as Promise<ChatMessage[]>;
      })
      .then((loadedMessages) => setMessages(loadedMessages))
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(requestError instanceof Error ? requestError.message : 'Unable to load messages.');
      });

    return () => controller.abort();
  }, [recipientId, user]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight });
  }, [messages]);

  function openConversation(conversation: ChatConversation) {
    setError('');
    setMessages([]);
    setRecipientId(conversation.userId);
    setRecipientName(conversation.username);
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanDraft = draft.trim();
    if (!user || !recipientId || !cleanDraft || !clientRef.current?.connected) return;

    const outgoingMessage: ChatMessage = {
      senderId: user.id,
      recipientId,
      content: cleanDraft,
    };

    clientRef.current.publish({
      destination: '/app/chat',
      body: JSON.stringify(outgoingMessage),
    });
    setDraft('');
  }

  return (
    <main>
      <SiteHeader search={<HeaderSearch />} />
      <section className={styles.chatShell}>
        <aside className={styles.sidebar}>
          <h1>Messages</h1>
          <p>Open a seller conversation from a listing, or continue one here.</p>

          <div className={styles.conversationList} aria-label="Recent conversations">
            {conversations.length === 0 ? (
              <p className={styles.sidebarNote}>No conversations yet</p>
            ) : conversations.map((conversation) => (
              <button
                className={`${styles.conversationItem} ${conversation.userId === recipientId ? styles.conversationItemActive : ''}`}
                type="button"
                key={conversation.userId}
                onClick={() => openConversation(conversation)}
              >
                <Image
                  src={conversation.avatarUrl || defaultAvatarUrl}
                  alt=""
                  width={40}
                  height={40}
                  loading="lazy"
                  unoptimized
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = defaultAvatarUrl;
                  }}
                />
                <span>
                  <strong>{conversation.username || `User ${conversation.userId}`}</strong>
                  <small>{conversation.lastMessage || 'No messages yet'}</small>
                </span>
                {conversation.lastMessageAt && (
                  <time dateTime={conversation.lastMessageAt}>{formatMessageTime(conversation.lastMessageAt)}</time>
                )}
              </button>
            ))}
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </aside>

        <section className={styles.conversation} aria-label="Chat conversation">
          <header className={styles.conversationHeader}>
            <div>
              <h2>{title}</h2>
              <span className={styles.status}>
                <span className={`${styles.statusDot} ${isConnected ? styles.statusDotConnected : ''}`} />
                {isConnected ? 'Connected' : 'Connecting'}
              </span>
            </div>
          </header>

          {!user && !isLoadingUser ? (
            <div className={styles.emptyState}>
              <h2>Log in to chat</h2>
              <p>Your conversations are available after signing in.</p>
            </div>
          ) : !recipientId ? (
            <div className={styles.emptyState}>
              <h2>No conversation selected</h2>
              <p>Pick a recipient to see messages here.</p>
            </div>
          ) : (
            <>
              <div className={styles.messages} ref={messagesRef}>
                {messages.length === 0 ? (
                  <div className={styles.emptyState}>
                    <h2>No messages yet</h2>
                    <p>Send the first message to start the conversation.</p>
                  </div>
                ) : messages.map((message) => (
                  <article
                    className={`${styles.message} ${message.senderId === user?.id ? styles.messageOwn : ''}`}
                    key={message.id ?? `${message.senderId}-${message.recipientId}-${message.timestamp}-${message.content}`}
                  >
                    <span>{message.content}</span>
                    {message.timestamp && <time dateTime={message.timestamp}>{formatMessageTime(message.timestamp)}</time>}
                  </article>
                ))}
              </div>

              <form className={styles.composer} onSubmit={sendMessage}>
                <input
                  aria-label="Message"
                  maxLength={1000}
                  placeholder={isConnected ? 'Write a message' : 'Waiting for connection'}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  disabled={!isConnected}
                />
                <button type="submit" aria-label="Send message" title="Send message" disabled={!draft.trim() || !isConnected}>
                  <Send size={18} aria-hidden="true" />
                </button>
              </form>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
