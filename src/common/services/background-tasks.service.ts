import { Injectable, Logger } from '@/core';

@Injectable()
export class BackgroundTasksService {
	private readonly logger = new Logger(BackgroundTasksService.name);

	/**
	 * Schedules an async task to run in the background without blocking the caller.
	 * Errors are logged and do not crash the process.
	 */
	run(task: Promise<void> | (() => Promise<void>)): void {
		queueMicrotask(() => {
			if (typeof task === 'function') {
				task().catch((err) => {
					this.logger.error('Background task failed', err);
				});
			} else {
				task.catch((err) => {
					this.logger.error('Background task failed', err);
				});
			}
		});
	}
}
