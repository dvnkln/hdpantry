import { env } from '$env/dynamic/private';

// For development only: the test container built from source (docker-compose.build.yml) sets
// HDPANTRY_DIAGNOSTICS=1. Then the scan pages send the figures of each attempt to the server
// (/scan/check?/log) and they are written to the log of the container – so a problem on a phone
// can be looked up instead of read off the screen. Never on in a normal installation, and never
// the content of a code.
export const diagnosticsOn = () => env.HDPANTRY_DIAGNOSTICS === '1';
