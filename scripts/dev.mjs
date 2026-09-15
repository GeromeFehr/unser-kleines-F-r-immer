import { BlobsServer } from '@netlify/blobs/server';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

// Local development needs no Netlify account. Production uses Netlify's
// automatically supplied Blobs context, never this local development server.
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const token = randomBytes(32).toString('hex');
const server = new BlobsServer({ directory: '.netlify/local-blobs', token });
const { address } = await server.start();
const context = Buffer.from(JSON.stringify({ siteID: 'forever-local', token, apiURL: address, edgeURL: address, uncachedEdgeURL: address })).toString('base64');
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--webpack', '-H', '127.0.0.1', ...process.argv.slice(2)], { stdio: 'inherit', env: { ...process.env, NETLIFY_BLOBS_CONTEXT: context } });
let stopping = false;
async function stop(code = 0) { if (stopping) return; stopping = true; child.kill('SIGTERM'); await server.stop(); process.exit(code); }
process.on('SIGINT', () => void stop()); process.on('SIGTERM', () => void stop());
child.on('exit', code => void stop(code || 0));
child.on('error', error => { console.error(error.message); void stop(1); });
