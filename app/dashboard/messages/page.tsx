"use client";

import { useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { MessageEncryption } from '@/lib/encryption';
import { useAuth } from '@/contexts/auth-context';

interface Conversation {
  id: string;
  encryption_key: string;
  seller: {
    id: string;
    username: string;
    avatar_url: string;
  };
  buyer: {
    id: string;
    username: string;
    avatar_url: string;
  };
  listing: {
    id: string;
    title: string;
  };
}

interface Message {
  id: string;
  encrypted_content: string;
  iv: string;
  sender_id: string;
  created_at: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/messages/conversations');
        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }
        const data = await response.json();
        setConversations(data);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const handleConversationClick = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    try {
      const response = await fetch(`/api/messages/${conversation.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();

      const key = await MessageEncryption.importKey(conversation.encryption_key);
      const decryptedMessages = await Promise.all(
        data.map(async (msg: Message) => {
          try {
            const decryptedContent = await MessageEncryption.decrypt(msg.encrypted_content, msg.iv, key);
            return { ...msg, encrypted_content: decryptedContent };
          } catch (e) {
            console.error("Failed to decrypt message:", msg.id, e);
            return { ...msg, encrypted_content: "This message could not be decrypted." };
          }
        })
      );
      setMessages(decryptedMessages);
    } catch (error) {
      console.error("Error processing conversation click:", error);
      setMessages([]);
    }
  };

  const renderConversationList = () => (
    <ul>
      {conversations.map((convo) => {
        const otherUser = user?.id === convo.seller.id ? convo.buyer : convo.seller;
        return (
          <li key={convo.id} onClick={() => handleConversationClick(convo)} className="p-4 border-b cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
            <div className="flex items-center">
              <img src={otherUser.avatar_url || '/placeholder-user.jpg'} alt={otherUser.username} className="w-10 h-10 rounded-full mr-4" />
              <div>
                <p className="font-semibold">{otherUser.username}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{convo.listing.title}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );

  const renderChatView = () => {
    if (!selectedConversation) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 dark:text-gray-400">Select a conversation to start chatting</p>
        </div>
      );
    }
    const otherUser = user?.id === selectedConversation.seller.id ? selectedConversation.buyer : selectedConversation.seller;
    return (
      <>
        <div className="p-4 border-b flex items-center">
          {!isDesktop && <button onClick={() => setSelectedConversation(null)} className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">Back</button>}
          <img src={otherUser.avatar_url || '/placeholder-user.jpg'} alt={otherUser.username} className="w-10 h-10 rounded-full mr-4" />
          <h2 className="text-xl font-bold">{otherUser.username}</h2>
        </div>
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {messages.map(msg => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-lg max-w-md ${isMe ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <p>{msg.encrypted_content}</p>
                  <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{new Date(msg.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t bg-white dark:bg-black">
          <input type="text" placeholder="Type a message..." className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
        </div>
      </>
    );
  };

  if (isDesktop) {
    return (
      <div className="flex h-screen">
        <aside className="w-1/3 border-r dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderConversationList()}
          </div>
        </aside>
        <main className="w-2/3 flex flex-col">
          {renderChatView()}
        </main>
      </div>
    );
  }

  return (
    <div>
      {selectedConversation ? (
        <div className="h-screen flex flex-col">
          {renderChatView()}
        </div>
      ) : (
        <div>
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold">Conversations</h2>
          </div>
          {renderConversationList()}
        </div>
      )}
    </div>
  );
}