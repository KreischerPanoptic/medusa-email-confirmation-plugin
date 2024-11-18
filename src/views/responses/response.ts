export class APIResponse<T> {
    success: boolean;
    error?: string;
    code?: ErrorCodeUnion;
    data?: T | null | undefined;
}

export enum ErrorCode {
    email_already_confirmed = 'email_already_confirmed',
    email_not_found = 'email_not_found',
    token_not_found = 'token_not_found',
    token_expired = 'token_expired',
    empty_token = 'empty_token',
    token_not_created = 'token_not_created',
}

export type ErrorCodeUnion = `${ErrorCode}`