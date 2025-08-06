import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UserService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        profile: {
            skills: {
                name: string;
                id: string;
            }[];
        } & {
            id: string;
            location: string | null;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            interests: string | null;
            userId: string;
        };
    } & {
        name: string;
        id: string;
        role: import(".prisma/client").$Enums.Role;
        email: string;
        password: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string): Promise<{
        profile: {
            skills: {
                name: string;
                id: string;
            }[];
        } & {
            id: string;
            location: string | null;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            interests: string | null;
            userId: string;
        };
    } & {
        name: string;
        id: string;
        role: import(".prisma/client").$Enums.Role;
        email: string;
        password: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        profile: {
            skills: {
                name: string;
                id: string;
            }[];
        } & {
            id: string;
            location: string | null;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            interests: string | null;
            userId: string;
        };
        name: string;
        id: string;
        role: import(".prisma/client").$Enums.Role;
        email: string;
        password: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        name: string;
        id: string;
        role: import(".prisma/client").$Enums.Role;
        email: string;
        password: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
