import { Archive, Refrigerator, Snowflake, ThermometerSnowflake } from '@lucide/svelte';
import type { Location } from './items';

// Symbol of each place of storage
export const LOCATION_ICONS: Record<Location, typeof Archive> = {
	pantry: Archive,
	fridge: Refrigerator,
	zero: ThermometerSnowflake,
	freezer: Snowflake
};
