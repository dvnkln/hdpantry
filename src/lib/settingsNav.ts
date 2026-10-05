import {
	Bell,
	Boxes,
	Database,
	Info,
	Palette,
	Scale,
	Server,
	Settings2,
	UserRound,
	Wrench
} from '@lucide/svelte';
import { m } from '$lib/i18n/index.svelte';

// Areas of the settings, in display order. A new area only needs one more line here (and its
// page under src/routes/settings/).
export function settingsSections() {
	return [
		{
			href: '/settings/general',
			group: 'personal',
			icon: Settings2,
			label: m.settings.general,
			hint: m.settings.generalHint
		},
		{
			href: '/settings/appearance',
			group: 'personal',
			icon: Palette,
			label: m.settings.appearance,
			hint: m.settings.appearanceHint
		},
		{
			href: '/settings/account',
			group: 'personal',
			icon: UserRound,
			label: m.settings.account,
			hint: m.settings.accountHint
		},
		{
			href: '/settings/notifications',
			group: 'personal',
			icon: Bell,
			label: m.notifications.title,
			hint: m.notifications.navHint
		},
		{
			href: '/settings/data',
			group: 'personal',
			icon: Database,
			label: m.settings.data,
			hint: m.settings.dataHint
		},
		{
			href: '/settings/containers',
			group: 'stock',
			icon: Boxes,
			label: m.settings.containers,
			hint: m.settings.containersShort
		},
		{
			href: '/settings/guide',
			group: 'stock',
			icon: Scale,
			label: m.settings.guide,
			hint: m.settings.guideShort
		},
		{
			href: '/settings/server',
			group: 'admin',
			icon: Server,
			label: m.settings.server,
			hint: m.settings.serverHint
		},
		{
			href: '/settings/maintenance',
			group: 'admin',
			icon: Wrench,
			label: m.settings.maintenance,
			hint: m.settings.maintenanceHint
		},
		{
			href: '/settings/about',
			group: 'about',
			icon: Info,
			label: m.about.title,
			hint: m.settings.aboutHint
		}
	] as const;
}

// Areas grouped for the sidebar and the list, with the group title (none for "about")
export function settingsGroups() {
	const sections = settingsSections();
	return [
		{ title: m.settings.groupPersonal, items: sections.filter((s) => s.group === 'personal') },
		{ title: m.settings.groupStock, items: sections.filter((s) => s.group === 'stock') },
		{ title: m.settings.groupAdmin, items: sections.filter((s) => s.group === 'admin') },
		{ title: null, items: sections.filter((s) => s.group === 'about') }
	].filter((group) => group.items.length);
}

// Where "Settings" leads on a computer: the first area
export const FIRST_SETTINGS_PAGE = '/settings/general';
