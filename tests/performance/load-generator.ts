/**
 * Utility for running API stress tests, performance benchmarks, and collecting metrics.
 */

export interface BenchmarkMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalTimeMs: number;
    rps: number; // Requests per second
    latency: {
        minMs: number;
        maxMs: number;
        meanMs: number;
        p50Ms: number;
        p90Ms: number;
        p95Ms: number;
        p99Ms: number;
    };
    memory: {
        heapBeforeMb: number;
        heapAfterMb: number;
        heapDeltaMb: number;
    };
}

export async function runLoadTest(
    taskFn: (index: number) => Promise<void>,
    options: {
        concurrency: number;
        totalRequests: number;
    }
): Promise<BenchmarkMetrics> {
    const { concurrency, totalRequests } = options;
    const heapBeforeMb = process.memoryUsage().heapUsed / 1024 / 1024;
    const latencies: number[] = [];
    let successfulCount = 0;
    let failedCount = 0;

    let currentIndex = 0;

    const startTime = performance.now();

    async function worker() {
        while (currentIndex < totalRequests) {
            const index = currentIndex++;
            const start = performance.now();
            try {
                await taskFn(index);
                latencies.push(performance.now() - start);
                successfulCount++;
            } catch (err) {
                latencies.push(performance.now() - start);
                failedCount++;
            }
        }
    }

    const workers = Array.from({ length: Math.min(concurrency, totalRequests) }, () => worker());
    await Promise.all(workers);

    const totalTimeMs = performance.now() - startTime;
    const heapAfterMb = process.memoryUsage().heapUsed / 1024 / 1024;

    latencies.sort((a, b) => a - b);

    const sum = latencies.reduce((acc, v) => acc + v, 0);
    const meanMs = latencies.length ? sum / latencies.length : 0;
    const minMs = latencies.length ? latencies[0] : 0;
    const maxMs = latencies.length ? latencies[latencies.length - 1] : 0;

    const getPercentile = (p: number) => {
        if (!latencies.length) return 0;
        const idx = Math.floor((p / 100) * latencies.length);
        return latencies[Math.min(idx, latencies.length - 1)];
    };

    return {
        totalRequests,
        successfulRequests: successfulCount,
        failedRequests: failedCount,
        totalTimeMs,
        rps: (totalRequests / totalTimeMs) * 1000,
        latency: {
            minMs,
            maxMs,
            meanMs,
            p50Ms: getPercentile(50),
            p90Ms: getPercentile(90),
            p95Ms: getPercentile(95),
            p99Ms: getPercentile(99),
        },
        memory: {
            heapBeforeMb,
            heapAfterMb,
            heapDeltaMb: heapAfterMb - heapBeforeMb,
        },
    };
}

export function printMetrics(testTitle: string, metrics: BenchmarkMetrics) {
    console.log(`\n================================================================`);
    console.log(` PERFORMANCE BENCHMARK: ${testTitle}`);
    console.log(`================================================================`);
    console.log(`  Total Operations:      ${metrics.totalRequests}`);
    console.log(`  Concurrency:           ${metrics.totalRequests / (metrics.totalTimeMs / 1000)} RPS`);
    console.log(`  Successful / Failed:   ${metrics.successfulRequests} / ${metrics.failedRequests}`);
    console.log(`  Total Duration:        ${metrics.totalTimeMs.toFixed(2)} ms`);
    console.log(`  Throughput (RPS):      ${metrics.rps.toFixed(2)} req/sec`);
    console.log(`----------------------------------------------------------------`);
    console.log(`  Latency Metrics:`);
    console.log(`    Min:                 ${metrics.latency.minMs.toFixed(2)} ms`);
    console.log(`    Mean:                ${metrics.latency.meanMs.toFixed(2)} ms`);
    console.log(`    p50 (Median):        ${metrics.latency.p50Ms.toFixed(2)} ms`);
    console.log(`    p90:                 ${metrics.latency.p90Ms.toFixed(2)} ms`);
    console.log(`    p95:                 ${metrics.latency.p95Ms.toFixed(2)} ms`);
    console.log(`    p99:                 ${metrics.latency.p99Ms.toFixed(2)} ms`);
    console.log(`    Max:                 ${metrics.latency.maxMs.toFixed(2)} ms`);
    console.log(`----------------------------------------------------------------`);
    console.log(`  Memory Delta:          ${metrics.memory.heapDeltaMb >= 0 ? '+' : ''}${metrics.memory.heapDeltaMb.toFixed(2)} MB`);
    console.log(`================================================================\n`);
}
