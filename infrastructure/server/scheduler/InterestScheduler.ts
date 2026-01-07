import * as cron from 'node-cron';
import { ApplyDailyInterestUseCase } from '@lehman-brothers/application';

/**
 * Scheduler for automated daily interest calculation
 * Runs every day at midnight (00:00) to apply interest to all savings books
 */
export class InterestScheduler {
    private task: cron.ScheduledTask | null = null;

    constructor(private readonly applyDailyInterestUseCase: ApplyDailyInterestUseCase) { }

    /**
     * Start the daily interest scheduler
     * Runs at 00:00 every day
     */
    start(): void {
        // Cron expression: "0 0 * * *" = At 00:00 every day
        this.task = cron.schedule('0 0 * * *', async () => {
            const timestamp = new Date().toISOString();
            console.log('[' + timestamp + '] Running daily interest calculation...');

            try {
                const result = await this.applyDailyInterestUseCase.execute({
                    executedBy: 'SYSTEM'
                });

                if (result.success) {
                    console.log('[' + timestamp + '] Daily interest applied successfully:');
                    console.log('   - Processed books: ' + result.processedBooks);
                    console.log('   - Total interest: ' + result.totalInterestApplied + ' EUR');
                } else {
                    console.error('[' + timestamp + '] Failed to apply daily interest:', result.error);
                }
            } catch (error) {
                console.error('[' + timestamp + '] Error during daily interest calculation:', error);
            }
        }, {
            timezone: 'Europe/Paris'
        });

        console.log('Interest scheduler started - Daily interest will be applied at 00:00 (Europe/Paris)');
    }

    /**
     * Stop the scheduler
     */
    stop(): void {
        if (this.task) {
            this.task.stop();
            console.log('Interest scheduler stopped');
        }
    }

    /**
     * Manually trigger interest calculation (for testing or manual runs)
     */
    async runNow(): Promise<void> {
        const timestamp = new Date().toISOString();
        console.log('[' + timestamp + '] Manual interest calculation triggered...');

        const result = await this.applyDailyInterestUseCase.execute({
            executedBy: 'SYSTEM'
        });

        if (result.success) {
            console.log('[' + timestamp + '] Manual interest applied:');
            console.log('   - Processed books: ' + result.processedBooks);
            console.log('   - Total interest: ' + result.totalInterestApplied + ' EUR');
        } else {
            console.error('[' + timestamp + '] Failed:', result.error);
        }
    }
}
