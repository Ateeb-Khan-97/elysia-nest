import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Section,
	Text,
} from '@react-email/components';

export type VerificationEmailProps = {
	fullName: string;
	verifyUrl: string;
};

export default function VerificationEmail({
	fullName,
	verifyUrl,
}: VerificationEmailProps) {
	return (
		<Html>
			<Head />
			<Body style={main}>
				<Container style={container}>
					<Heading style={h1}>Verify your email</Heading>
					<Text style={text}>Hi {fullName},</Text>
					<Text style={text}>
						Thanks for signing up. Please verify your email address so you can sign in.
					</Text>
					<Section style={buttonSection}>
						<Button style={button} href={verifyUrl}>
							Confirm email
						</Button>
					</Section>
					<Hr style={hr} />
					<Text style={footer}>
						If you didn't create an account, you can ignore this email.
					</Text>
				</Container>
			</Body>
		</Html>
	);
}

VerificationEmail.PreviewProps = {
	fullName: 'Alex',
	verifyUrl: 'https://example.com/verify-email?token=abc123',
} satisfies VerificationEmailProps;

const main = {
	backgroundColor: '#f5f5f5',
	fontFamily: 'sans-serif',
	padding: '24px',
};

const container = {
	backgroundColor: '#ffffff',
	borderRadius: '8px',
	maxWidth: '480px',
	margin: '0 auto' as const,
	padding: '32px',
	boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

const h1 = {
	fontSize: '20px',
	color: '#111',
	margin: '0 0 16px',
};

const text = {
	color: '#444',
	lineHeight: 1.5,
	margin: '0 0 24px',
	fontSize: '14px',
};

const buttonSection = {
	margin: '0 0 24px',
};

const button = {
	backgroundColor: '#2563eb',
	color: '#fff',
	textDecoration: 'none',
	padding: '12px 24px',
	borderRadius: '6px',
	fontWeight: 600,
	fontSize: '14px',
};

const hr = {
	borderColor: '#eee',
	margin: '24px 0 0',
};

const footer = {
	fontSize: '12px',
	color: '#888',
	margin: '24px 0 0',
};
