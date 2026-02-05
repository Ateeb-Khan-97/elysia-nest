import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '@/config/env.config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type VerificationEmailOptions = {
	fullName: string;
	token: string;
};

const LAYOUT = readFileSync(join(__dirname, 'verification-email.html'), 'utf-8');

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function getVerificationLink(): string | null {
	if (!env.APP_URL) return null;
	return `${env.APP_URL.replace(/\/$/, '')}/verify-email?token=`;
}

function buildContent(options: VerificationEmailOptions): string {
	const { token } = options;
	const baseLink = getVerificationLink();
	const fullLink = baseLink ? baseLink + encodeURIComponent(token) : null;

	if (fullLink) {
		return `
    <p style="margin:0 0 24px;">
      <a href="${escapeHtml(fullLink)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;">Confirm email</a>
    </p>
    <p style="margin:0;font-size:13px;color:#666;">
      Or copy this link: <a href="${escapeHtml(fullLink)}" style="color:#2563eb;word-break:break-all;">${escapeHtml(fullLink)}</a>
    </p>
    `.trim();
	}

	return `
    <p style="margin:0 0 8px;font-size:13px;color:#666;">Use this token on the confirm-email endpoint:</p>
    <p style="margin:0;font-family:monospace;font-size:12px;background:#f5f5f5;padding:12px;border-radius:4px;word-break:break-all;">${escapeHtml(token)}</p>
    `.trim();
}

export function buildVerificationHtml(options: VerificationEmailOptions): string {
	return LAYOUT.replace('{{fullName}}', escapeHtml(options.fullName)).replace(
		'{{content}}',
		buildContent(options),
	);
}

export function buildVerificationText(options: VerificationEmailOptions): string {
	const { fullName, token } = options;
	const baseLink = getVerificationLink();
	const fullLink = baseLink ? baseLink + encodeURIComponent(token) : null;

	const intro = `Hi ${fullName},\n\nThanks for signing up.`;
	const outro = "\n\nIf you didn't create an account, you can ignore this email.";

	return fullLink
		? `${intro} Verify your email by opening this link:\n\n${fullLink}${outro}`
		: `${intro} Use this token to confirm your email (submit to the confirm-email endpoint):\n\n${token}${outro}`;
}
