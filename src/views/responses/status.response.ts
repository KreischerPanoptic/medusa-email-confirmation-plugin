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