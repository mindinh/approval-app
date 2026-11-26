/**
 * Local dev on a real phone with Expo Go — `npm run dev:expo-go [-- --host <ip>] [-- --clear]`.
 *
 *   1. Picks this PC's Wi-Fi/LAN IPv4 (or --host / EXPO_DEV_HOST) — phone and PC must share the network.
 *   2. Metro advertises that IP (REACT_NATIVE_PACKAGER_HOSTNAME), so the QR code and redirect URI use it.
 *   3. Points EXPO_PUBLIC_API_URL at http://<ip>:4005 for this session (overrides .env.local).
 *   4. Prints the redirect URI to register in Entra: exp://<ip>:8081/--/auth (reserve the IP to keep it stable).
 */
import { networkInterfaces } from 'node:os';
import { BFF_PATH, BFF_PORT, METRO_PORT, checkBff, log, parseArgs, printSummary, startExpo } from './lib/dev-shared.mjs';

const VIRTUAL_ADAPTER = /vethernet|virtual|vmware|vbox|hyper-v|wsl|docker|loopback|bluetooth|tailscale|zerotier|vpn/i;
const WIRELESS_ADAPTER = /wi-?fi|wlan|wireless/i;
const PRIVATE_IPV4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

/** Prefers a Wi-Fi adapter, then any physical adapter with a private IPv4 address. */
function detectLanIp() {
    const candidates = Object.entries(networkInterfaces())
        .filter(([name]) => !VIRTUAL_ADAPTER.test(name))
        .flatMap(([name, addresses]) =>
            (addresses ?? [])
                .filter((address) => address.family === 'IPv4' && !address.internal && PRIVATE_IPV4.test(address.address))
                .map((address) => ({ name, ip: address.address }))
        );
    const best = candidates.find((candidate) => WIRELESS_ADAPTER.test(candidate.name)) ?? candidates[0];
    if (best) log.ok(`Using ${best.ip} (${best.name})`);
    return best?.ip;
}

const { options, rest } = parseArgs(process.argv.slice(2), ['host']);
const host = options.host ?? process.env.EXPO_DEV_HOST ?? detectLanIp();
if (!host) {
    log.fail('No LAN IPv4 address found. Connect to Wi-Fi, or pass one: npm run dev:expo-go -- --host 192.168.1.20');
    process.exit(1);
}

const bffOrigin = `http://${host}:${BFF_PORT}`;
await checkBff(
    bffOrigin,
    `If it runs but is unreachable on ${host}, allow ports ${METRO_PORT} and ${BFF_PORT} in Windows Firewall (Private network).`
);

const redirectUri = `exp://${host}:${METRO_PORT}/--/auth`;
printSummary([
    ['Target', 'Phone with Expo Go (same Wi-Fi as this PC)'],
    ['BFF', `${bffOrigin}${BFF_PATH}`],
    ['Entra redirect URI', `${redirectUri}   ← must be registered on the Entra app`],
    ['Open', 'scan the QR code below (iPhone: Camera app · Android: Expo Go)'],
]);

startExpo(['--lan', ...rest], {
    REACT_NATIVE_PACKAGER_HOSTNAME: host,
    EXPO_PUBLIC_API_URL: `${bffOrigin}${BFF_PATH}`,
});
