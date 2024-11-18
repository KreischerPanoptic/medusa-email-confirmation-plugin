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

export class StatusResponseViewModel {
    status: ConfirmationStatusUnion;
}

export enum ConfirmationStatus {
    confirmed = 'confirmed',
    awaiting = 'awaiting',
    uninitialized = 'uninitialized',
    expired = 'expired'
}

export type ConfirmationStatusUnion = `${ConfirmationStatus}`

export class EmailRequestViewModel {
    email: string;
}

export class TokenRequestViewModel extends EmailRequestViewModel {
    token: string;
}