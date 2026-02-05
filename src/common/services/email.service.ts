import nodemailer from 'nodemailer';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { env } from '@/config/env.config';
import VerificationEmail from '@/emails/verification-email';
import { Injectable, Logger } from '@/core';

export type SendEmailOptions = {
	to: string;
	subject: string;
	html: string;
};

export type SendVerificationEmailOptions = {
	to: string;
	fullName: string;
	token: string;
};

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

	private async sendEmail(options: SendEmailOptions): Promise<void> {
		const { to, subject, html } = options;
		try {
			await this.transporter.sendMail({
				from: `"${env.GOOGLE_APP_EMAIL.split('@')[0]}" <${env.GOOGLE_APP_EMAIL}>`,
				to,
				subject,
				html,
			});
			this.logger.debug(`Email sent to ${to}`);
		} catch (error) {
			this.logger.error(`Failed to send email to ${to}: ${error}`);
		}
	}

	async sendVerificationEmail(options: SendVerificationEmailOptions): Promise<void> {
		const { to, fullName, token } = options;
		const base = env.APP_URL.replace(/\/$/, '');
		const verifyUrl = `${base}/verify-email?token=${encodeURIComponent(token)}`;
		const html = renderToStaticMarkup(
			createElement(VerificationEmail, { fullName, verifyUrl }),
		);
		await this.sendEmail({ to, subject: 'Verify your email', html });
	}
}
