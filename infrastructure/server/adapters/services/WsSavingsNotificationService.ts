import { SavingsBookType } from '@lehman-brothers/domain';
import { SavingsNotificationService, SavingsRateChangedPayload, SavingsBookRepository } from '@lehman-brothers/application';
import { WsServerService } from './WsServerService';

/**
 * WebSocket implementation of SavingsNotificationService
 * Notifies clients about savings rate changes
 */
export class WsSavingsNotificationService implements SavingsNotificationService {
    constructor(
        private readonly wsService: WsServerService,
        private readonly savingsBookRepository: SavingsBookRepository
    ) { }

    async notifyUser(userId: string, payload: SavingsRateChangedPayload): Promise<void> {
        this.wsService.broadcastToUser(userId, {
            type: 'savings:rate_changed' as any,
            payload,
        });
    }

    async notifySavingsBookHolders(bookType: SavingsBookType, payload: SavingsRateChangedPayload): Promise<void> {
        // Get all savings books of this type
        const savingsBooks = await this.savingsBookRepository.findByType(bookType);

        // Get unique user IDs
        const userIds = [...new Set(savingsBooks.map((book) => book.getUserId()))];

        // Notify each user who has a savings book of this type
        for (const userId of userIds) {
            await this.notifyUser(userId, payload);
        }

        // Also broadcast to all clients role (they might be interested)
        this.wsService.broadcastToRole('CLIENT', {
            type: 'savings:rate_changed' as any,
            payload,
        });
    }
}
