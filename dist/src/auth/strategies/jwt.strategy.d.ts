import { ConfigService } from '@nestjs/config';
interface JwtPayload {
    sub: string;
    email: string;
    role: 'STUDENT' | 'ALUM' | 'ADMIN';
}
declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(config: ConfigService);
    validate(payload: JwtPayload): Promise<{
        userId: string;
        email: string;
        role: "STUDENT" | "ALUM" | "ADMIN";
    }>;
}
export {};
