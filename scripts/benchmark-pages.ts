import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Load .env from workspace manually
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            if (process.env[key] === undefined) {
                process.env[key] = val;
            }
        }
    }
}

async function run() {
    const { SapClient } = await import(pathToFileURL(path.resolve(process.cwd(), 'srv/lib/integrations/sap-client.ts')).href);
    const { InboxProcessor } = await import(pathToFileURL(path.resolve(process.cwd(), 'srv/lib/processors/inbox-processor.ts')).href);

    interface ODataCallLog {
        method: string;
        service: string;
        path: string;
        params: string;
        startOffsetMs: number;
        durationMs: number;
        status: 'OK' | 'ERR';
        error?: string;
        sizeBytes?: number;
    }

    let currentPhaseStart = 0;
    let callLogs: ODataCallLog[] = [];

    function startPhase() {
        currentPhaseStart = performance.now();
        callLogs = [];
    }

    const origGet = SapClient.prototype.get;
    SapClient.prototype.get = async function <T>(
        servicePath: string,
        relativePath: string,
        params: any = {},
        sapUser?: string,
        userJwt?: string
    ): Promise<T> {
        const start = performance.now();
        const startOffsetMs = start - currentPhaseStart;
        const paramStr = params && Object.keys(params).length ? JSON.stringify(params) : '';
        try {
            const res = await origGet.call(this, servicePath, relativePath, params, sapUser, userJwt);
            const durationMs = performance.now() - start;
            let sizeBytes = 0;
            try {
                sizeBytes = Buffer.byteLength(JSON.stringify(res), 'utf8');
            } catch {}
            callLogs.push({
                method: 'GET',
                service: servicePath.split('/').pop() || servicePath,
                path: relativePath,
                params: paramStr,
                startOffsetMs,
                durationMs,
                status: 'OK',
                sizeBytes,
            });
            return res as T;
        } catch (err: any) {
            const durationMs = performance.now() - start;
            callLogs.push({
                method: 'GET',
                service: servicePath.split('/').pop() || servicePath,
                path: relativePath,
                params: paramStr,
                startOffsetMs,
                durationMs,
                status: 'ERR',
                error: err?.message || String(err),
            });
            throw err;
        }
    };

    function printPhaseReport(title: string, totalMs: number) {
        console.log(`\n================================================================================`);
        console.log(`📊 ${title} — Total Wall Time: ${totalMs.toFixed(1)} ms (${callLogs.length} SAP OData calls)`);
        console.log(`================================================================================`);
        for (const c of callLogs) {
            const sizeKb = c.sizeBytes ? `${(c.sizeBytes / 1024).toFixed(1)} KB` : '-';
            console.log(
                `  [+${c.startOffsetMs.toFixed(0).padStart(5)}ms -> ${(c.startOffsetMs + c.durationMs).toFixed(0).padStart(5)}ms] ` +
                `(${c.durationMs.toFixed(0).padStart(5)}ms) | ${c.status} | ${sizeKb.padStart(8)} | ${c.path} ${c.params}`
            );
            if (c.error) {
                console.log(`     ↳ Error: ${c.error}`);
            }
        }
    }

    async function measureEndpointFetch(name: string, urls: string[]) {
        const start = performance.now();
        const results = await Promise.all(
            urls.map(async (u) => {
                const t0 = performance.now();
                const res = await fetch(`http://127.0.0.1:4005/api/cnma/APPROVAL_SRV/tasks${u}`);
                const text = await res.text();
                return {
                    url: u,
                    status: res.status,
                    durationMs: performance.now() - t0,
                    sizeKb: (Buffer.byteLength(text, 'utf8') / 1024).toFixed(1),
                    data: res.ok ? JSON.parse(text) : null,
                };
            })
        );
        const total = performance.now() - start;
        console.log(`\n🌐 [HTTP BFF Benchmark] ${name} — Wall Time: ${total.toFixed(1)} ms`);
        for (const r of results) {
            console.log(`   • GET /tasks${r.url.padEnd(40)} | ${r.status} | ${r.durationMs.toFixed(1).padStart(7)} ms | ${r.sizeKb} KB`);
        }
        return results;
    }

    console.log('🚀 Starting Page First-Load Performance Benchmark...');
    const sapUser = process.env.SAP_TASK_USER || 'MOCK_USER';
    console.log(`Configured SAP User: ${sapUser}`);

    try {
        const health = await fetch('http://127.0.0.1:4005/api/cnma/APPROVAL_SRV/health');
        if (health.ok) {
            console.log('✅ Detected running BFF server on http://127.0.0.1:4005');
            await measureEndpointFetch('Page 1: HomePage First Load (Parallel BFF requests)', [
                '/me',
                '/status-counts',
                '?top=5',
            ]);

            await measureEndpointFetch('Page 2: InboxPage First Load (Initial Category Counts - My Scope Only)', [
                '/me',
                '/category-counts?scope=my',
            ]);

            await measureEndpointFetch('Page 2B: InboxPage Expanded Categories (PR + PO + RESERVATION + CLAIM)', [
                '?top=25&skip=0&category=PR',
                '?top=25&skip=0&category=PO',
                '?top=25&skip=0&category=RESERVATION',
                '?top=25&skip=0&category=CLAIM',
            ]);

            await measureEndpointFetch('Page 3: ApprovedPage First Load (Approved Scope Only)', [
                '/category-counts?scope=approved',
                '/approved?top=25&skip=0&category=PR',
            ]);

            await measureEndpointFetch('Page 4: DashboardPage First Load', [
                '/dashboard?top=50&skip=0',
            ]);
        }
    } catch (e: any) {
        console.log(`ℹ️ Direct HTTP BFF check on 4005 skipped (${e.message}), running in-process processor trace...`);
    }

    const processor = new InboxProcessor();

    // --- Page 1: HomePage ---
    startPhase();
    const tHome = performance.now();
    const [, homeTasks] = await Promise.all([
        processor.getStatusCounts(sapUser).catch((e: any) => ({ error: e.message })),
        processor.getTasks(sapUser, undefined, { top: 5 }).catch((e: any) => ({ items: [], error: e.message })),
    ]);
    printPhaseReport('PAGE 1: HOME PAGE (useStatusCounts + useTasks(top=5))', performance.now() - tHome);

    // --- Page 2: InboxPage (Initial Mount - My Scope Only) ---
    startPhase();
    const tInbox = performance.now();
    await processor.getCategoryCounts(sapUser, 'my').catch(() => null);
    printPhaseReport('PAGE 2A: INBOX PAGE INITIAL COUNTS (myCounts only)', performance.now() - tInbox);

    // --- Page 2B: InboxPage when categories expand (or all 4 categories fetched) ---
    startPhase();
    const tInboxCats = performance.now();
    const [prList, poList, resvList, claimList] = await Promise.all([
        processor.getTasks(sapUser, undefined, { top: 25, skip: 0 }, { category: 'PR' }).catch(() => ({ items: [] })),
        processor.getTasks(sapUser, undefined, { top: 25, skip: 0 }, { category: 'PO' }).catch(() => ({ items: [] })),
        processor.getTasks(sapUser, undefined, { top: 25, skip: 0 }, { category: 'RESERVATION' }).catch(() => ({ items: [] })),
        processor.getTasks(sapUser, undefined, { top: 25, skip: 0 }, { category: 'CLAIM' }).catch(() => ({ items: [] })),
    ]);
    printPhaseReport('PAGE 2B: INBOX PAGE CATEGORY LISTS (PR, PO, RESERVATION, CLAIM)', performance.now() - tInboxCats);

    // Pick sample tasks for TaskDetail benchmark
    const sampleTasks: Array<{ type: string; id: string }> = [];
    const allFetched = [
        ...((homeTasks as any)?.items || []),
        ...((prList as any)?.items || []),
        ...((poList as any)?.items || []),
        ...((resvList as any)?.items || []),
        ...((claimList as any)?.items || []),
    ];
    const seenTypes = new Set<string>();
    for (const item of allFetched) {
        const type = item.objectType || item.DocCategory || 'UNKNOWN';
        const id = item.instanceId || item.WorkflowTaskInternalID;
        if (id && !seenTypes.has(type)) {
            seenTypes.add(type);
            sampleTasks.push({ type, id });
        }
    }

    // --- Page 3: Task Detail View ---
    for (const sample of sampleTasks.slice(0, 4)) {
        startPhase();
        const tDetail = performance.now();
        try {
            await processor.getTaskDetail(sample.id, sapUser);
        } catch (err: any) {
            console.error(`TaskDetail failed for ${sample.id}: ${err.message}`);
        }
        printPhaseReport(`PAGE 3: TASK DETAIL (/inbox/${sample.id} - Type: ${sample.type})`, performance.now() - tDetail);
    }

    // --- Page 4: Dashboard Page ---
    startPhase();
    const tDash = performance.now();
    await processor.getDashboardSummary(sapUser, undefined, { top: 50, skip: 0 });
    printPhaseReport('PAGE 4: DASHBOARD PAGE (/dashboard?top=50&skip=0)', performance.now() - tDash);
}

run().catch((err) => {
    console.error('Benchmark error:', err);
    process.exit(1);
});
