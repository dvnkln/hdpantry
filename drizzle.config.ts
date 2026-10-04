import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'sqlite',
	dbCredentials: { url: `${process.env.DATA_DIR ?? './data'}/hdpantry.db` },
	verbose: true,
	strict: true
});
