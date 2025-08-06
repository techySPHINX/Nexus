import { ConnectionService } from './connection.service';
import { CreateConnectionDto, UpdateConnectionStatusDto } from './dto/connection.dto';
export declare class ConnectionController {
    private readonly connectionService;
    constructor(connectionService: ConnectionService);
    sendRequest(dto: CreateConnectionDto, req: any): Promise<{
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
    updateStatus(dto: UpdateConnectionStatusDto, req: any): Promise<{
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
    getConnections(req: any): Promise<({
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
    getPending(req: any): Promise<({
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
