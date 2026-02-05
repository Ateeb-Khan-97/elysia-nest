import nodemailer from 'nodemailer';
import { env } from '@/config/env.config';
import {
	buildVerificationHtml,
	buildVerificationText,
	type VerificationEmailOptions,
} from '@/common/email-templates/verification-email';
import { Injectable, Logger } from '@/core';

export type SendVerificationEmailOptions = VerificationEmailOptions & { to: string };

@Injectable()
export class EmailService {
	private readonly logger = new Logger(EmailService.name);
	private readonly transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 587,
		secure: false,
		auth: {
			user: env.GOOGLE_APP_EMAIL,
			pass: env.GOOGLE_APP_PASSWORD,
		},
	});

	async sendVerificationEmail(options: SendVerificationEmailOptions): Promise<void> {
		const { to, fullName, token } = options;
		const html = buildVerificationHtml({ fullName, token });
		const text = buildVerificationText({ fullName, token });

		await this.transporter.sendMail({
			from: `"${env.GOOGLE_APP_EMAIL.split('@')[0]}" <${env.GOOGLE_APP_EMAIL}>`,
			to,
			subject: 'Verify your email',
			text,
			html,
		});

		this.logger.debug(`Verification email sent to ${to}`);
	}
}
