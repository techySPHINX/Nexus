"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MessagingService = class MessagingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async sendMessage(senderId, dto) {
        const { receiverId, content } = dto;
        const receiver = await this.prisma.user.findUnique({
            where: { id: receiverId },
        });
        if (!receiver) {
            throw new common_1.NotFoundException('Receiver user not found');
        }
        const isConnected = await this.prisma.connection.findFirst({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { requesterId: senderId, recipientId: receiverId },
                    { requesterId: receiverId, recipientId: senderId },
                ],
            },
        });
        if (!isConnected) {
            throw new common_1.ForbiddenException('You can only send messages to users you are connected with');
        }
        return this.prisma.message.create({
            data: {
                content,
                senderId,
                receiverId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }
    async getConversation(userId, otherUserId, dto) {
        const { skip = 0, take = 20 } = dto;
        const isConnected = await this.prisma.connection.findFirst({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { requesterId: userId, recipientId: otherUserId },
                    { requesterId: otherUserId, recipientId: userId },
                ],
            },
        });
        if (!isConnected) {
            throw new common_1.ForbiddenException('You can only view conversations with users you are connected with');
        }
        return this.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId },
                ],
            },
            orderBy: { timestamp: 'desc' },
            skip,
            take,
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }
    async getAllConversations(userId) {
        const conversations = await this.prisma.message.groupBy({
            by: ['senderId', 'receiverId'],
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }],
            },
        });
        const conversationDetails = await Promise.all(conversations.map(async (conversation) => {
            const otherUserId = conversation.senderId === userId
                ? conversation.receiverId
                : conversation.senderId;
            const latestMessage = await this.prisma.message.findFirst({
                where: {
                    OR: [
                        { senderId: userId, receiverId: otherUserId },
                        { senderId: otherUserId, receiverId: userId },
                    ],
                },
                orderBy: { timestamp: 'desc' },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    receiver: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });
            const otherUser = await this.prisma.user.findUnique({
                where: { id: otherUserId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profile: {
                        select: {
                            bio: true,
                            location: true,
                        },
                    },
                },
            });
            return {
                conversationId: `${userId}-${otherUserId}`,
                otherUser,
                latestMessage,
            };
        }));
        return conversationDetails;
    }
};
exports.MessagingService = MessagingService;
exports.MessagingService = MessagingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MessagingService);
//# sourceMappingURL=messaging.service.js.map