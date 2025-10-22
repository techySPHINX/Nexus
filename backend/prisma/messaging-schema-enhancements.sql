-- Enhanced Message model for production-scale chat
-- Add these fields to the existing Message model in schema.prisma

-- Add these fields to the Message model:
--   messageType     MessageType @default(TEXT)
--   attachmentUrl   String?
--   attachmentType  String?
--   replyToId       String?
--   replyTo         Message?   @relation("MessageReplies", fields: [replyToId], references: [id])
--   replies         Message[]  @relation("MessageReplies")
--   status          MessageStatus @default(SENT)
--   editedAt        DateTime?
--   deletedAt       DateTime?
--   metadata        Json?
--   sequenceNumber  Int        @default(0)
--   conversationId  String?
--   conversation    Conversation? @relation(fields: [conversationId], references: [id])
--   readReceipts    MessageReadReceipt[]
--   reactions        MessageReaction[]

-- Add these new models:

-- Conversation model for grouping messages
model Conversation {
  id                String    @id @default(uuid())
  type              ConversationType @default(DIRECT)
  name              String?
  description       String?
  avatarUrl         String?
  createdById       String
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastMessageAt     DateTime?
  lastMessageId     String?
  lastMessage       Message?  @relation("LastMessage", fields: [lastMessageId], references: [id])
  
  -- Relations
  messages          Message[]
  participants      ConversationParticipant[]
  createdBy         User      @relation(fields: [createdById], references: [id])
  
  @@map("conversations")
}

-- Conversation participants
model ConversationParticipant {
  id             String       @id @default(uuid())
  conversationId String
  userId         String
  role           ParticipantRole @default(MEMBER)
  joinedAt       DateTime    @default(now())
  leftAt         DateTime?
  lastReadAt     DateTime?
  lastReadMessageId String?
  
  -- Relations
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  lastReadMessage Message?     @relation("LastReadMessage", fields: [lastReadMessageId], references: [id])
  
  @@unique([conversationId, userId])
  @@map("conversation_participants")
}

-- Message read receipts
model MessageReadReceipt {
  id        String   @id @default(uuid())
  messageId String
  userId    String
  readAt    DateTime @default(now())
  
  -- Relations
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([messageId, userId])
  @@map("message_read_receipts")
}

-- Message reactions
model MessageReaction {
  id        String   @id @default(uuid())
  messageId String
  userId    String
  emoji     String
  createdAt DateTime @default(now())
  
  -- Relations
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([messageId, userId, emoji])
  @@map("message_reactions")
}

-- User presence tracking
model UserPresence {
  id        String   @id @default(uuid())
  userId    String   @unique
  status    PresenceStatus @default(OFFLINE)
  lastSeen DateTime @default(now())
  metadata  Json?
  
  -- Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("user_presence")
}

-- Enums
enum MessageType {
  TEXT
  IMAGE
  FILE
  AUDIO
  VIDEO
  SYSTEM
}

enum MessageStatus {
  SENDING
  SENT
  DELIVERED
  READ
  FAILED
}

enum ConversationType {
  DIRECT
  GROUP
  CHANNEL
}

enum ParticipantRole {
  ADMIN
  MODERATOR
  MEMBER
}

enum PresenceStatus {
  ONLINE
  AWAY
  BUSY
  OFFLINE
}

-- Add these relations to existing User model:
--   conversationsCreated    Conversation[]
--   conversationParticipants ConversationParticipant[]
--   messageReadReceipts      MessageReadReceipt[]
--   messageReactions         MessageReaction[]
--   presence                 UserPresence?
