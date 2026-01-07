import { SavingsBookType } from '@lehman-brothers/domain';

/**
 * Savings notification service abstraction (Application layer)
 * Defines contract for notifying clients about savings rate changes
 */

export interface SavingsRateChangedPayload {
    bookType: SavingsBookType;
    oldRate: number;
    newRate: number;
    effectiveDate: string;
}

export interface SavingsNotificationService {
    /**
     * Notify a specific user about a rate change
     */
    notifyUser(userId: string, payload: SavingsRateChangedPayload): Promise<void>;

    /**
     * Notify all users who have a savings book of specific type about a rate change
     */
    notifySavingsBookHolders(bookType: SavingsBookType, payload: SavingsRateChangedPayload): Promise<void>;
}
