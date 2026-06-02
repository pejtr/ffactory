import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load env
const dotenv = require('dotenv');
dotenv.config({ path: '/home/ubuntu/video-factory/.env' });

// Direct pipeline call
const { runVideoPipeline } = await import('/home/ubuntu/video-factory/server/pipeline.ts');

console.log('Starting pipeline for project 90001...');
await runVideoPipeline(90001);
console.log('Pipeline completed!');
