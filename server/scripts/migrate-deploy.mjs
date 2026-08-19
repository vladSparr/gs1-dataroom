// Applies pending migrations, then hands control back to the start script.
//
// Prisma reads connection strings straight out of the process environment.
// Locally dotenv strips surrounding quotes and trailing whitespace first, so a
// string that works on a laptop can still reach Prisma malformed on a hosting
// dashboard, where the value is passed through verbatim. The failure surfaces
// as an opaque `P1013: The scheme is not recognized`, which names neither the
// variable at fault nor what was actually received. This script normalises what
// it safely can, reports what it saw, and fails with a message that says which
// variable to fix.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Present in local development, absent on the host, where the platform injects
// the variables directly. npm runs this with the package directory as its cwd.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const SCHEME = /^postgres(ql)?:\/\//;

/** Dashboards keep quotes and stray whitespace; dotenv would have removed them. */
function normalise(value) {
  return value
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
}

/** Host, port and database only — never the credentials. */
function describe(value) {
  try {
    const url = new URL(value);
    return `${url.hostname}:${url.port || '5432'}${url.pathname}`;
  } catch {
    return 'unparseable';
  }
}

function read(name) {
  const raw = process.env[name];

  if (raw === undefined || raw.trim() === '') {
    console.log(`  ${name}: not set`);
    return null;
  }

  const value = normalise(raw);
  const changed = value !== raw ? ', normalised' : '';
  const valid = SCHEME.test(value);

  console.log(
    `  ${name}: ${raw.length} chars, scheme ${valid ? 'ok' : 'INVALID'}${changed}` +
      (valid ? `, ${describe(value)}` : ''),
  );

  if (!valid) {
    console.error(
      `\n${name} does not start with postgresql://. It begins with ` +
        `${JSON.stringify(value.slice(0, 12))}. Check the environment variable ` +
        `for wrapping quotes, a stray newline, or a copied "psql " prefix.`,
    );
    return null;
  }

  process.env[name] = value;
  return value;
}

console.log('Checking database connection strings:');

const databaseUrl = read('DATABASE_URL');
const directUrl = read('DIRECT_URL');

if (!databaseUrl) {
  console.error('\nDATABASE_URL is missing or malformed — cannot migrate.');
  process.exit(1);
}

// Migrations must not run through the transaction pooler. When DIRECT_URL is
// absent, derive the session-pooler equivalent rather than silently migrating
// over pgbouncer, which fails with `prepared statement "s0" already exists`.
if (!directUrl) {
  const derived = new URL(databaseUrl);
  derived.port = '5432';
  derived.searchParams.delete('pgbouncer');
  process.env.DIRECT_URL = derived.toString();

  console.log(
    `  DIRECT_URL: derived from DATABASE_URL -> ${describe(process.env.DIRECT_URL)}`,
  );
}

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
