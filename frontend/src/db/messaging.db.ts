import Dexie, { Table } from 'dexie';

/**
 * IndexedDB Schema for Messaging
 *
 * Provides offline-first messaging with local persistence.
 * Messages are stored locally and synced with the server.
 */

export interface DBMessage {
  id: string; // Server-assigned message ID (or tempId for pending messages)
  conversationId: string; // Composite key: `${userId1}-${userId2}` (sorted)
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  createdAt: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  tempId?: string; // Temporary ID for optimistic updates
  isEdited?: boolean;
  editedAt?: string;
  deletedAt?: string;
  isRead?: boolean;
  readAt?: string;
}

export interface DBConversation {
  id: string; // Composite key: `${userId1}-${userId2}` (sorted)
  otherUserId: string;
  otherUserName: string;
  otherUserEmail: string;
  otherUserProfilePicture?: string;
  lastMessageId?: string;
  lastMessageContent?: string;
  lastMessageTimestamp?: string;
  unreadCount: number;
  updatedAt: string;
}

export interface DBUserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
  updatedAt: string;
}

export class MessagingDatabase extends Dexie {
  messages!: Table<DBMessage, string>;
  conversations!: Table<DBConversation, string>;
  userPresence!: Table<DBUserPresence, string>;

  constructor() {
    super('NexusMessagingDB');

    // Define schema
    this.version(1).stores({
      messages:
        'id, conversationId, senderId, receiverId, timestamp, status, tempId',
      conversations: 'id, otherUserId, lastMessageTimestamp, updatedAt',
      userPresence: 'userId, isOnline, updatedAt',
    });
  }

  /**
   * Save a message to IndexedDB
   */
  async saveMessage(message: DBMessage): Promise<void> {
    try {
      await this.messages.put(message);
      console.log('💾 Message saved to IndexedDB:', message.id);
    } catch (error) {
      console.error('❌ Error saving message to IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Get all messages for a conversation
   */
  async getMessagesForConversation(
    conversationId: string,
    limit: number = 50
  ): Promise<DBMessage[]> {
    try {
      const messages = await this.messages
        .where('conversationId')
        .equals(conversationId)
        .reverse()
        .sortBy('timestamp');

      return messages.slice(0, limit).reverse();
    } catch (error) {
      console.error('❌ Error loading messages from IndexedDB:', error);
      return [];
    }
  }

  /**
   * Get paginated messages for infinite scroll
   */
  async getMessagesPage(
    conversationId: string,
    beforeTimestamp: string,
    limit: number = 20
  ): Promise<DBMessage[]> {
    try {
      const messages = await this.messages
        .where('conversationId')
        .equals(conversationId)
        .and((msg) => msg.timestamp < beforeTimestamp)
        .reverse()
        .sortBy('timestamp');

      return messages.slice(0, limit).reverse();
    } catch (error) {
      console.error('❌ Error loading message page from IndexedDB:', error);
      return [];
    }
  }

  /**
   * Update message status (sending -> sent -> delivered -> read)
   */
  async updateMessageStatus(
    messageId: string,
    status: DBMessage['status'],
    additionalData?: Partial<DBMessage>
  ): Promise<void> {
    try {
      const message = await this.messages.get(messageId);
      if (message) {
        await this.messages.update(messageId, {
          status,
          ...additionalData,
        });
        console.log(`💾 Message ${messageId} status updated to ${status}`);
      }
    } catch (error) {
      console.error('❌ Error updating message status:', error);
    }
  }

  /**
   * Update message by tempId (for optimistic updates)
   */
  async updateMessageByTempId(
    tempId: string,
    updates: Partial<DBMessage>
  ): Promise<void> {
    try {
      const message = await this.messages
        .where('tempId')
        .equals(tempId)
        .first();
      if (message) {
        await this.messages.update(message.id, updates);
        console.log(`💾 Message with tempId ${tempId} updated`);
      }
    } catch (error) {
      console.error('❌ Error updating message by tempId:', error);
    }
  }

  /**
   * Mark message as edited
   */
  async markMessageAsEdited(
    messageId: string,
    newContent: string,
    editedAt: string
  ): Promise<void> {
    try {
      await this.messages.update(messageId, {
        content: newContent,
        isEdited: true,
        editedAt,
      });
      console.log(`💾 Message ${messageId} marked as edited`);
    } catch (error) {
      console.error('❌ Error marking message as edited:', error);
    }
  }

  /**
   * Mark message as deleted
   */
  async markMessageAsDeleted(
    messageId: string,
    deletedAt: string
  ): Promise<void> {
    try {
      await this.messages.update(messageId, {
        content: 'This message has been deleted',
        deletedAt,
      });
      console.log(`💾 Message ${messageId} marked as deleted`);
    } catch (error) {
      console.error('❌ Error marking message as deleted:', error);
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, readAt: string): Promise<void> {
    try {
      await this.messages.update(messageId, {
        isRead: true,
        readAt,
        status: 'read',
      });
      console.log(`💾 Message ${messageId} marked as read`);
    } catch (error) {
      console.error('❌ Error marking message as read:', error);
    }
  }

  /**
   * Save or update a conversation
   */
  async saveConversation(conversation: DBConversation): Promise<void> {
    try {
      await this.conversations.put(conversation);
      console.log('💾 Conversation saved to IndexedDB:', conversation.id);
    } catch (error) {
      console.error('❌ Error saving conversation to IndexedDB:', error);
    }
  }

  /**
   * Get all conversations, sorted by last message timestamp
   */
  async getAllConversations(): Promise<DBConversation[]> {
    try {
      const conversations = await this.conversations
        .orderBy('updatedAt')
        .reverse()
        .toArray();
      return conversations;
    } catch (error) {
      console.error('❌ Error loading conversations from IndexedDB:', error);
      return [];
    }
  }

  /**
   * Update conversation's unread count
   */
  async updateConversationUnreadCount(
    conversationId: string,
    unreadCount: number
  ): Promise<void> {
    try {
      await this.conversations.update(conversationId, {
        unreadCount,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Error updating conversation unread count:', error);
    }
  }

  /**
   * Clear unread count for a conversation (when user opens it)
   */
  async clearUnreadCount(conversationId: string): Promise<void> {
    try {
      await this.conversations.update(conversationId, {
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Error clearing unread count:', error);
    }
  }

  /**
   * Update user presence status
   */
  async updateUserPresence(
    userId: string,
    isOnline: boolean,
    lastSeen?: string
  ): Promise<void> {
    try {
      await this.userPresence.put({
        userId,
        isOnline,
        lastSeen: lastSeen || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Error updating user presence:', error);
    }
  }

  /**
   * Get user presence status
   */
  async getUserPresence(userId: string): Promise<DBUserPresence | undefined> {
    try {
      return await this.userPresence.get(userId);
    } catch (error) {
      console.error('❌ Error getting user presence:', error);
      return undefined;
    }
  }

  /**
   * Get the timestamp of the last message (for sync)
   */
  async getLastMessageTimestamp(): Promise<string | null> {
    try {
      const lastMessage = await this.messages
        .orderBy('timestamp')
        .reverse()
        .first();
      return lastMessage?.timestamp || null;
    } catch (error) {
      console.error('❌ Error getting last message timestamp:', error);
      return null;
    }
  }

  /**
   * Clear all data (for logout)
   */
  async clearAllData(): Promise<void> {
    try {
      await this.messages.clear();
      await this.conversations.clear();
      await this.userPresence.clear();
      console.log('💾 All IndexedDB data cleared');
    } catch (error) {
      console.error('❌ Error clearing IndexedDB data:', error);
    }
  }
}

// Export singleton instance
export const messagingDB = new MessagingDatabase();
