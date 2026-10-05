import type { Outgoing } from '../channels';
import { isWebhookUrl } from './webhook';

// ntfy (ntfy.sh, or a server of one's own): a message is published to a topic; whoever
// subscribed to that topic in the ntfy app gets it. The icon is only an address the phone
// loads by itself.
//
// Like a webhook, the server is the user's choice and may be in their own network. ONCE
// THERE ARE SEVERAL USERS the same limit as for webhooks applies (see webhook.ts).

const TIMEOUT_MS = 10_000;
export const DEFAULT_SERVER = 'https://ntfy.sh';
export const MAX_TOKEN_LENGTH = 200;

export type NtfyConfig = {
	server: string; // without the topic, no slash at the end
	topic: string;
	// Access token for a protected topic ("tk_…"); empty if the topic is open
	token: string;
	// Address of the icon shown next to the message; empty = the one of this hdpantry
	icon: string;
};

// ntfy's own rule for topic names
export const isNtfyTopic = (text: string) => /^[-_A-Za-z0-9]{1,64}$/.test(text);
export const isNtfyToken = (text: string) =>
	text.length <= MAX_TOKEN_LENGTH && /^[A-Za-z0-9_.~+/=-]+$/.test(text);
// "https://ntfy.example.com/" → "https://ntfy.example.com"; null if it is no such address
export function cleanServer(text: string) {
	const server = text.trim().replace(/\/+$/, '');
	return isWebhookUrl(server) && !/[?#]/.test(server) ? server : null;
}

// A header may only hold plain characters; ntfy reads everything else in this wrapping
// (RFC 2047) – umlauts, dashes, emoji and line breaks arrive as they are.
const encoded = (text: string) => `=?UTF-8?B?${Buffer.from(text, 'utf8').toString('base64')}?=`;

type Answer = { error?: string };

// Sends one message. Never throws; `error` says why it did not work.
export async function sendNtfy(config: NtfyConfig, message: Outgoing) {
	const headers: Record<string, string> = { Title: encoded(message.title) };
	if (config.token) headers.Authorization = `Bearer ${config.token}`;
	if (message.link) headers.Click = message.link;
	const icon = config.icon || message.icon;
	if (icon) headers.Icon = icon;
	try {
		const res = await fetch(`${config.server}/${config.topic}`, {
			method: 'PUT',
			headers,
			body: message.body,
			// A redirect could lead somewhere the user never entered
			redirect: 'manual',
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
		if (res.ok) return { ok: true as const };
		const text = await res.text().catch(() => '');
		let reason = '';
		try {
			reason = (JSON.parse(text) as Answer).error ?? '';
		} catch {
			// no JSON (e.g. a proxy in front of it): the status has to do
		}
		return {
			ok: false as const,
			error: `HTTP ${res.status}${reason ? ` – ${reason.slice(0, 200)}` : ''}`
		};
	} catch {
		return { ok: false as const, error: 'unreachable' };
	}
}
