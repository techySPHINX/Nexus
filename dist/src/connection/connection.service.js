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
exports.ConnectionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ConnectionService = class ConnectionService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async sendRequest(requesterId, recipientId) {
        if (requesterId === recipientId) {
            throw new common_1.BadRequestException('Cannot connect to yourself');
        }
        const recipient = await this.prisma.user.findUnique({
            where: { id: recipientId },
        });
        if (!recipient) {
            throw new common_1.NotFoundException('Recipient user not found');
        }
        const existingConnection = await this.prisma.connection.findFirst({
            where: {
                OR: [
                    {
                        requesterId,
                        recipientId,
                    },
                    {
                        requesterId: recipientId,
                        recipientId: requesterId,
                    },
                ],
            },
        });
        if (existingConnection) {
            if (existingConnection.status === 'PENDING') {
                throw new common_1.ConflictException('Connection request already sent');
            }
            else if (existingConnection.status === 'ACCEPTED') {
                throw new common_1.ConflictException('Users are already connected');
            }
            else if (existingConnection.status === 'BLOCKED') {
                throw new common_1.ForbiddenException('Connection is blocked');
            }
        }
        return this.prisma.connection.create({
            data: {
                requesterId,
                recipientId,
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                recipient: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }
    async updateStatus(userId, dto) {
        const connection = await this.prisma.connection.findUnique({
            where: { id: dto.connectionId },
            include: {
                requester: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                recipient: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!connection) {
            throw new common_1.NotFoundException('Connection not found');
        }
        if (connection.recipientId !== userId) {
            throw new common_1.ForbiddenException('You are not the recipient of this connection request');
        }
        if (connection.status !== 'PENDING') {
            throw new common_1.BadRequestException('Connection request has already been processed');
        }
        return this.prisma.connection.update({
            where: { id: dto.connectionId },
            data: {
                status: dto.status,
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                recipient: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }
    async getConnections(userId) {
        return this.prisma.connection.findMany({
            where: {
                OR: [{ requesterId: userId }, { recipientId: userId }],
                status: 'ACCEPTED',
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile: {
                            select: {
                                bio: true,
                                location: true,
                                interests: true,
                                skills: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                recipient: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile: {
                            select: {
                                bio: true,
                                location: true,
                                interests: true,
                                skills: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }
    async getPendingRequests(userId) {
        return this.prisma.connection.findMany({
            where: {
                recipientId: userId,
                status: 'PENDING',
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile: {
                            select: {
                                bio: true,
                                location: true,
                                interests: true,
                                skills: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }
};
exports.ConnectionService = ConnectionService;
exports.ConnectionService = ConnectionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConnectionService);
//# sourceMappingURL=connection.service.js.map