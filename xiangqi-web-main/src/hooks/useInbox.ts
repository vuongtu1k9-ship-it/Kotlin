import { useState, useEffect } from 'react';
import { getSocket } from '../net/socket';
import { fetchInboxSocket } from '../net/socket';
import { useAuth } from '../auth/AuthContext';

export interface InboxMessage {
  _id: string;
  fromUid: string;
  fromName?: string;
  fromPicture?: string;
  toUid: string;
  type: 'text' | 'new_follower';
  content: string;
  text?: string;
  messageId?: string;
  status: 'unread' | 'read' | 'accepted' | 'declined';
  createdAt: number;
}

let globalMessages: InboxMessage[] = [];
let listeners: Array<(msgs: InboxMessage[]) => void> = [];

const notify = () => {
    listeners.forEach(l => l([...globalMessages]));
};

export function useInbox() {
    const { state: authState } = useAuth();
    const [messages, setMessages] = useState<InboxMessage[]>(globalMessages);
    const authUid = authState.user?.uid;

    useEffect(() => {
        const handler = (msgs: InboxMessage[]) => setMessages(msgs);
        listeners.push(handler);
        return () => {
            listeners = listeners.filter(l => l !== handler);
        };
    }, []);

    useEffect(() => {
        if (!authUid) {
            globalMessages = [];
            notify();
            return;
        }

        const socket = getSocket();

        // Initial fetch via socket if empty or on reconnect
        const syncInbox = async () => {
            const res = await fetchInboxSocket();
            if (res.ok && Array.isArray(res.messages)) {
                globalMessages = res.messages;
                notify();
            }
        };

        if (globalMessages.length === 0) {
            syncInbox();
        }

        const handleNewMessage = (msg: InboxMessage) => {
            // Update or add
            const idx = globalMessages.findIndex(m => m._id === msg._id);
            if (idx !== -1) {
                globalMessages[idx] = msg;
            } else {
                globalMessages = [msg, ...globalMessages];
            }
            notify();
        };

        const handleDirectMessage = (msg: InboxMessage) => {
            // Map legacy 'direct_message' to our inbox
            handleNewMessage(msg);
        };

        socket.on('messages:inbox', (res: any) => {
            if (res.ok && Array.isArray(res.messages)) {
                globalMessages = res.messages;
                notify();
            }
        });

        socket.on('direct_message', handleDirectMessage);
        
        // Also listen for general chat messages that might be DMs
        const handleChatMessage = (msg: any) => {
            if (msg.roomId?.startsWith('dm::')) {
                // If we want to sync the last message into inbox list
                // we could do it here, but direct_message usually covers it.
            }
        };
        socket.on('chat:message', handleChatMessage);

        return () => {
            socket.off('messages:inbox');
            socket.off('direct_message', handleDirectMessage);
            socket.off('chat:message', handleChatMessage);
        };
    }, [authUid]);

    return { 
        messages, 
        unreadCount: messages.filter(m => m.toUid === authUid && m.status === 'unread').length 
    };
}
