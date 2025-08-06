import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateConnectionStatusDto } from './dto/connection.dto';
export declare class ConnectionService {
    private prisma;
    constructor(prisma: PrismaService);
    sendRequest(requesterId: string, recipientId: string): Promise<{
        requester: {
            name: string;
            id: string;
            email: string;
        };
        recipient: {
            name: string;
            id: string;
            email: string;
        };
    } & {
        status: import(".prisma/client").$Enums.ConnectionStatus;
        id: string;
        createdAt: Date;
        recipientId: string;
        requesterId: string;
    }>;
    updateStatus(userId: string, dto: UpdateConnectionStatusDto): Promise<{
        requester: {
            name: string;
            id: string;
            email: string;
        };
        recipient: {
            name: string;
            id: string;
            email: string;
        };
    } & {
        status: import(".prisma/client").$Enums.ConnectionStatus;
        id: string;
        createdAt: Date;
        recipientId: string;
        requesterId: string;
    }>;
    getConnections(userId: string): Promise<({
        requester: {
            name: string;
            id: string;
            email: string;
            profile: {
                location: string;
                bio: string;
                interests: string;
                skills: {
                    name: string;
                }[];
            };
        };
        recipient: {
            name: string;
            id: string;
            email: string;
            profile: {
                location: string;
                bio: string;
                interests: string;
                skills: {
                    name: string;
                }[];
            };
        };
    } & {
        status: import(".prisma/client").$Enums.ConnectionStatus;
        id: string;
        createdAt: Date;
        recipientId: string;
        requesterId: string;
    })[]>;
    getPendingRequests(userId: string): Promise<({
        requester: {
            name: string;
            id: string;
            email: string;
            profile: {
                location: string;
                bio: string;
                interests: string;
                skills: {
                    name: string;
                }[];
            };
        };
    } & {
        status: import(".prisma/client").$Enums.ConnectionStatus;
        id: string;
        createdAt: Date;
        recipientId: string;
        requesterId: string;
    })[]>;
}
