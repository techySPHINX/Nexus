import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { FilterMessagesDto } from './dto/filter-messages.dto';
export declare class MessagingService {
    private prisma;
    constructor(prisma: PrismaService);
    sendMessage(senderId: string, dto: CreateMessageDto): Promise<{
        sender: {
            name: string;
            id: string;
            email: string;
        };
        receiver: {
            name: string;
            id: string;
            email: string;
        };
    } & {
        content: string;
        id: string;
        receiverId: string;
        timestamp: Date;
        senderId: string;
    }>;
    getConversation(userId: string, otherUserId: string, dto: FilterMessagesDto): Promise<({
        sender: {
            name: string;
            id: string;
            email: string;
        };
        receiver: {
            name: string;
            id: string;
            email: string;
        };
    } & {
        content: string;
        id: string;
        receiverId: string;
        timestamp: Date;
        senderId: string;
    })[]>;
    getAllConversations(userId: string): Promise<{
        conversationId: string;
        otherUser: {
            name: string;
            id: string;
            email: string;
            profile: {
                location: string;
                bio: string;
            };
        };
        latestMessage: {
            sender: {
                name: string;
                id: string;
                email: string;
            };
            receiver: {
                name: string;
                id: string;
                email: string;
            };
        } & {
            content: string;
            id: string;
            receiverId: string;
            timestamp: Date;
            senderId: string;
        };
    }[]>;
}
