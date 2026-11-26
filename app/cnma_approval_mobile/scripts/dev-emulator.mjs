/**
 * Local dev on the Android emulator — `npm run dev:emulator [-- --avd <name>] [-- --clear]`.
 *
 *   1. Boots an emulator if none is running (first AVD, or --avd / ANDROID_AVD).
 *   2. `adb reverse` maps emulator localhost:8081 (Metro) and :4005 (BFF) to this PC, so nothing depends on Wi-Fi.
 *   3. Starts Metro with --localhost: the Entra redirect URI is always exp://127.0.0.1:8081/--/auth.
 *   4. Points EXPO_PUBLIC_API_URL at http://localhost:4005 for this session (overrides .env.local).
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { BFF_PATH, BFF_PORT, METRO_PORT, checkBff, log, parseArgs, printSummary, startExpo } from './lib/dev-shared.mjs';

const BOOT_TIMEOUT_MS = 180_000;
const BOOT_POLL_MS = 2_000;
// Emulator log lines are coloured; strip the escape codes before matching "ERROR".
const ANSI_COLOR = /\x1b\[[0-9;]*m/g;
const EXE = process.platform === 'win32' ? '.exe' : '';

/** Android SDK root: ANDROID_HOME / ANDROID_SDK_ROOT, else Android Studio's default install location. */
function findSdkRoot() {
    const candidates = [
        process.env.ANDROID_HOME,
        process.env.ANDROID_SDK_ROOT,
        process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
        process.env.HOME && join(process.env.HOME, 'Library', 'Android', 'sdk'),
        process.env.HOME && join(process.env.HOME, 'Android', 'Sdk'),
    ];
    return candidates.find((root) => root && existsSync(join(root, 'platform-tools')));
}

const sdkRoot = findSdkRoot();
const sdkTool = (...segments) => (sdkRoot ? join(sdkRoot, ...segments) : segments.at(-1)); // fall back to PATH
const adb = sdkTool('platform-tools', `adb${EXE}`);
const emulator = sdkTool('emulator', `emulator${EXE}`);
// The emulator needs the SDK root in its environment (Android Studio sets it; a plain terminal may not).
const sdkEnv = sdkRoot ? { ...process.env, ANDROID_SDK_ROOT: sdkRoot, ANDROID_HOME: sdkRoot } : process.env;
const run = (tool, args) => execFileSync(tool, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function bootCompleted() {
    try {
        return run(adb, ['shell', 'getprop', 'sys.boot_completed']) === '1';
    } catch {
        return false; // device not ready for shell yet
    }
}

function runningDevices() {
    return run(adb, ['devices'])
        .split(/\r?\n/)
        .slice(1)
        .filter((line) => /\tdevice$/.test(line));
}

async function ensureEmulator(avdOption) {
    if (runningDevices().length > 0) {
        log.ok('Android device/emulator already running');
        return;
    }
    // Newer emulators may print "INFO | …" lines before the AVD names.
    const avds = execFileSync(emulator, ['-list-avds'], { encoding: 'utf8', env: sdkEnv })
        .split(/\r?\n/)
        .filter((line) => line.trim() && !line.includes('|'));
    const avd = avdOption ?? process.env.ANDROID_AVD ?? avds[0];
    if (!avd) throw new Error('No Android Virtual Device found. Create one in Android Studio → Device Manager.');

    log.step(`Booting emulator "${avd}"…`);
    let exited = null;
    const errors = [];
    const child = spawn(emulator, ['-avd', avd], { detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: sdkEnv });
    const collectErrors = (chunk) =>
        errors.push(
            ...String(chunk)
                .replace(ANSI_COLOR, '')
                .split(/\r?\n/)
                .filter((line) => line.startsWith('ERROR'))
        );
    child.stdout.on('data', collectErrors);
    child.stderr.on('data', collectErrors);
    child.on('close', (code) => (exited = code ?? 1)); // 'close' fires after the output above is flushed
    child.unref();
    const release = () => [child.stdout, child.stderr].forEach((stream) => stream.destroy());

    const deadline = Date.now() + BOOT_TIMEOUT_MS;
    while (Date.now() < deadline) {
        if (exited !== null) {
            const reason = errors.length ? `\n    ${errors.join('\n    ')}` : ' Start it once from Android Studio → Device Manager to see why.';
            throw new Error(`Emulator "${avd}" exited (code ${exited}).${reason}`);
        }
        if (runningDevices().length > 0 && bootCompleted()) {
            release();
            log.ok(`Emulator "${avd}" booted`);
            return;
        }
        await sleep(BOOT_POLL_MS);
    }
    throw new Error(`Emulator did not finish booting within ${BOOT_TIMEOUT_MS / 1000}s.`);
}

const { options, rest } = parseArgs(process.argv.slice(2), ['avd']);
try {
    await ensureEmulator(options.avd);
    for (const port of [METRO_PORT, BFF_PORT]) run(adb, ['reverse', `tcp:${port}`, `tcp:${port}`]);
    log.ok(`adb reverse: emulator localhost:${METRO_PORT} and :${BFF_PORT} → this PC`);
} catch (error) {
    log.fail(error instanceof Error ? error.message : String(error));
    process.exit(1);
}

const bffOrigin = `http://localhost:${BFF_PORT}`;
await checkBff(bffOrigin);

const redirectUri = `exp://127.0.0.1:${METRO_PORT}/--/auth`;
printSummary([
    ['Target', 'Android emulator (Expo Go)'],
    ['BFF', `${bffOrigin}${BFF_PATH}`],
    ['Entra redirect URI', redirectUri],
]);

startExpo(['--localhost', '--android', ...rest], { EXPO_PUBLIC_API_URL: `${bffOrigin}${BFF_PATH}` });
