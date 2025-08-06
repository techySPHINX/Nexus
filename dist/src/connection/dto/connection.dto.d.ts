export declare class CreateConnectionDto {
    recipientId: string;
}
export declare class UpdateConnectionStatusDto {
    connectionId: string;
    status: 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
}
