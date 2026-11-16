/** Helpers shared by the local dev launchers (dev-emulator.mjs, dev-expo-go.mjs). */
import { spawn } from 'node:child_process';

export const METRO_PORT = 8081;
export const BFF_PORT = 4005;
export const BFF_PATH = '/api/cnma/APPROVAL_SRV';

const BFF_PROBE_TIMEOUT_MS = 2_000;

/**
 * Splits `--name value` options this launcher understands from the arguments forwarded to `expo start`.
 * @param {string[]} argv
 * @param {string[]} names
 */
export function parseArgs(argv, names) {
    const options = {};
    const rest = [];
    for (let i = 0; i < argv.length; i++) {
        const name = argv[i].replace(/^--/, '');
        if (argv[i].startsWith('--') && names.includes(name) && argv[i + 1]) options[name] = argv[++i];
        else rest.push(argv[i]);
    }
    return { options, rest };
}

export const log = {
    step: (message) => console.log(`\x1b[36m›\x1b[0m ${message}`),
    ok: (message) => console.log(`\x1b[32m✔\x1b[0m ${message}`),
    warn: (message) => console.log(`\x1b[33m⚠\x1b[0m ${message}`),
    fail: (message) => console.error(`\x1b[31m✖\x1b[0m ${message}`),
};

/** True when something answers HTTP on the BFF origin (any status counts: the server is up). */
export async function isBffReachable(origin) {
    try {
        await fetch(origin, { signal: AbortSignal.timeout(BFF_PROBE_TIMEOUT_MS) });
        return true;
    } catch {
        return false;
    }
}

export async function checkBff(origin, hint) {
    if (await isBffReachable(origin)) {
        log.ok(`BFF is up at ${origin}`);
        return;
    }
    log.warn(`BFF is not answering at ${origin}. Start it from the repo root in another terminal:`);
    console.log('    npm run dev:be:watch');
    if (hint) console.log(`  ${hint}`);
}

export function printSummary(rows) {
    const width = Math.max(...rows.map(([label]) => label.length));
    console.log('');
    for (const [label, value] of rows) console.log(`  ${label.padEnd(width)}  ${value}`);
    console.log('');
}

/** Runs `npx expo start …` in this terminal (keeps Expo's interactive keys) and exits with it. */
export function startExpo(args, env) {
    const expo = spawn('npx', ['expo', 'start', ...args], {
        stdio: 'inherit',
        shell: process.platform === 'win32',
        env: { ...process.env, ...env },
    });
    expo.on('exit', (code) => process.exit(code ?? 0));
}
