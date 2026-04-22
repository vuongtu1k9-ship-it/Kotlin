import fetch from 'node-fetch';
import https from 'https';
import http from 'http';
import { execSync } from 'child_process';

console.log(`
--------------------------------------------------
🛡️  XIANGQI POWER GATE v3.0 - Level 3 Protection
--------------------------------------------------`);

const args = process.argv.slice(2);
const baseUrlArg = args.find(a => a.startsWith('--url='))?.split('=')[1] || 'http://localhost:3000';
const mode = args.find(a => a.startsWith('--mode='))?.split('=')[1] || 'quick'; // quick | full | power
const expectedVersion = args.find(a => a.startsWith('--version='))?.split('=')[1];
const hostHeader = args.find(a => a.startsWith('--host='))?.split('=')[1];

let baseUrl = baseUrlArg.replace(/\/$/, '').replace(/\/health$/, '');

console.log(`🚀 Starting Xiangqi Quality Gate...`);
console.log(`📍 Destination: ${baseUrl}`);
if (hostHeader) console.log(`🏠 Host Header: ${hostHeader}`);
console.log(`🏃 Mode: ${mode}`);
console.log(`----------------------------------\n`);

// dynamicPaths will now store objects: { path: string, requireVideo: boolean }
let auditPaths = [
    { path: '/', requireVideo: false },
    { path: '/puzzles', requireVideo: false },
    { path: '/ai', requireVideo: false },
    { path: '/practice', requireVideo: false },
    { path: '/players', requireVideo: false },
    { path: '/xep-co-the', requireVideo: false }
];

let sampleIds = { puzzles: [], games: [], players: [] };

const isLocal = baseUrlArg.includes('127.0.0.1') || baseUrlArg.includes('localhost');
if (isLocal) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const fetchOptions = {
    agent: (parsedUrl) => {
        if (parsedUrl.protocol === 'https:') return httpsAgent;
        return null;
    },
    headers: hostHeader ? { 
        'Host': hostHeader, 
        'X-Forwarded-Proto': 'https' 
    } : {}
};

async function fetchDynamicSamples() {
    if (mode === 'quick') return;
    console.log(`🔍 Fetching dynamic samples from DB with Video Requirements...`);
    
    const tryQuery = (cmd) => {
        try {
            const out = execSync(cmd, { stdio: 'pipe' }).toString().trim();
            if (out.includes('[{') || out.includes('{')) {
                // Try to find the JSON part if there's noise
                const match = out.match(/(\[.*\]|\{.*\})/s);
                if (match) return JSON.parse(match[1]);
            }
            return JSON.parse(out);
        } catch (e) {
            return null;
        }
    };

    const queries = {
        // Return [{uid, hasVideo}]
        puzzles: "db.puzzles.find({}, {uid:1, solutions:1, moves:1}).limit(3).toArray().map(p => ({id: p.uid, reqVideo: (p.solutions?.length > 0 || p.moves?.length > 0)}))",
        // Return [{id, hasVideo}]
        games: "db.matches.find({status:\\\"finished\\\"}, {_id:1, \\\"state.moveHistory\\\":1}).limit(3).toArray().map(g => ({id: g._id, reqVideo: (g.state?.moveHistory?.length > 0)}))",
        players: "db.users.find({uid:{\\$exists:true}}, {uid:1}).limit(3).toArray().map(u => u.uid)",
        practice: "db.practice_lessons.find({}, {categorySlug:1, slug:1}).limit(2).toArray().map(p => p.categorySlug + \\\"/\\\" + p.slug)"
    };

    try {
        const results = {};
        const isRemoteProd = baseUrl.includes('cotuong.xyz') && !baseUrl.includes('dev.cotuong.xyz');
        const isRemoteDev = baseUrl.includes('dev.cotuong.xyz');
        const remoteIp = isRemoteProd ? '192.168.80.139' : (isRemoteDev ? '192.168.1.23' : null);

        for (const [key, evalStr] of Object.entries(queries)) {
            const cmdStr = `mongosh xiangqi --eval 'print(JSON.stringify(${evalStr}))' --quiet`;
            let data = null;

            // If we are testing a remote server, we MUST get samples from its database
            if (remoteIp) {
                console.log(`📡 Fetching ${key} from remote DB (${remoteIp})...`);
                data = tryQuery(`timeout 15s ssh ${remoteIp} "${cmdStr}"`);
            }

            // Fallback to local only if not remote or if remote failed
            if (!data) {
                data = tryQuery(`timeout 5s ${cmdStr}`);
            }

            results[key] = data || [];
        }

        sampleIds.puzzles = (results.puzzles || []).map(p => p.id);
        sampleIds.games = (results.games || []).map(g => g.id);
        sampleIds.players = results.players || [];

        const newItems = [];
        const puzzles = results.puzzles || [];
        const games = results.games || [];
        const players = results.players || [];
        const practice = results.practice || [];

        const maxLen = Math.max(puzzles.length, games.length, players.length, practice.length);
        for (let i = 0; i < maxLen; i++) {
        if (puzzles[i]) newItems.push({ path: `/puzzles/${puzzles[i].id}`, requireVideo: puzzles[i].reqVideo });
        if (games[i]) newItems.push({ path: `/game/${games[i].id}`, requireVideo: games[i].reqVideo });
        if (players[i]) newItems.push({ path: `/player/${players[i]}`, requireVideo: false });
        if (practice[i]) newItems.push({ path: `/practice/${practice[i]}`, requireVideo: false });
        }
        
        if (newItems.length > 0) {
            // Merge and ensure uniqueness by path
            const seen = new Set();
            const combined = [...newItems, ...auditPaths];
            auditPaths = combined.filter(item => {
                if (seen.has(item.path)) return false;
                seen.add(item.path);
                return true;
            });
            console.log(`✅ Collected ${auditPaths.length} unique paths for audit (Interleaved & Prioritized).`);
        }
    } catch (err) {
        console.warn(`⚠️  Warning: Could not fetch dynamic samples. Using defaults. ${err.message}`);
    }
}

async function verifyDataAPIs(internalBaseUrl) {
    console.log(`\n--- [Stage 2: Data API Integrity Audit] ---`);
    const checkApi = async (path, label) => {
        console.log(`🔍 Checking API: ${label} (${path})`);
        const res = await fetch(`${internalBaseUrl}${path}`, fetchOptions);
        if (!res.ok) throw new Error(`API ${label} FAILED: HTTP ${res.status}`);
        const data = await res.json();
        console.log(`   - ✅ ${label} is operational.`);
        return data;
    };

    await checkApi('/api/site-settings', 'Site Settings');
    if (sampleIds.puzzles[0]) await checkApi(`/api/puzzles/${sampleIds.puzzles[0]}`, `Puzzle Detail`);
    if (sampleIds.games[0]) await checkApi(`/api/games/${sampleIds.games[0]}`, `Game Detail`);
    if (sampleIds.players[0]) await checkApi(`/api/users/${encodeURIComponent(sampleIds.players[0])}/summary`, `User Profile`);
}

async function verifyPathSEO(internalBaseUrl, item) {
    const { path, requireVideo } = item;
    console.log(`🔍 Auditing SEO/OG for: ${path} (Video Req: ${requireVideo})`);
    const seoOptions = { ...fetchOptions, headers: { ...fetchOptions.headers, 'User-Agent': 'Googlebot' } };
    
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const seoRes = await fetch(`${internalBaseUrl}${path}${path.includes('?') ? '&' : '?'}cache-bypass=${Date.now()}`, {
                ...seoOptions,
                headers: { ...seoOptions.headers, 'Cache-Control': 'no-cache' }
            });
            if (!seoRes.ok) throw new Error(`HTTP ${seoRes.status}`);
            
            const html = await seoRes.text();
            
            // Critical Meta Check
            const requiredMetas = ['og:title', 'og:image', 'og:url', 'og:description', 'og:type'];
            for (const meta of requiredMetas) {
                if (!html.includes(meta)) throw new Error(`MISSING META TAG: ${meta}`);
            }

            if (requireVideo && !html.includes('og:video')) {
                throw new Error(`MISSING REQUIRED VIDEO: ${path} should have og:video because it has playable content.`);
            }
            
            // Verify OG:IMAGE accessibility
            const imageMatch = html.match(/property="og:image" content="(.*?)"/);
            if (imageMatch && imageMatch[1]) {
                let imageUrl = imageMatch[1];
                // 🛡️ Power Gate Fix: Always test the LOCAL version of the image during deployment verification
                // Replace any cotuong.xyz origin with the internal test URL
                if (imageUrl.includes('cotuong.xyz')) {
                    const urlObj = new URL(imageUrl);
                    imageUrl = `${internalBaseUrl}${urlObj.pathname}${urlObj.search}`;
                }
                const imgCheckRes = await fetch(imageUrl, { method: 'HEAD', ...fetchOptions });
                if (!imgCheckRes.ok) throw new Error(`BROKEN OG:IMAGE (${imgCheckRes.status}): ${imageUrl}`);
                console.log(`   - ✅ og:image is healthy.`);
            }

            // Verify OG:VIDEO accessibility if present
            const videoMatch = html.match(/property="og:video" content="(.*?)"/);
            if (videoMatch && videoMatch[1]) {
                let videoUrl = videoMatch[1];
                // 🛡️ Power Gate Fix: Always test the LOCAL version of the video during deployment verification
                if (videoUrl.includes('cotuong.xyz')) {
                    const urlObj = new URL(videoUrl);
                    videoUrl = `${internalBaseUrl}${urlObj.pathname}${urlObj.search}`;
                }
                const vidCheckRes = await fetch(videoUrl, { method: 'HEAD', ...fetchOptions });
                if (!vidCheckRes.ok) {
                    if (vidCheckRes.status === 504 || vidCheckRes.status === 502) {
                        console.warn(`   ⚠️ og:video is slow/timeout (${vidCheckRes.status}), but this is expected for on-demand generation.`);
                    } else {
                        throw new Error(`BROKEN OG:VIDEO (${vidCheckRes.status}): ${videoUrl}`);
                    }
                } else {
                    console.log(`   - ✅ og:video is healthy.`);
                }
            }

            console.log(`   - ✅ SEO & OG passed.`);
            return true;
        } catch (err) {
            if (attempt === 2) throw err;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

async function runLighthouse(targetUrl) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🔍 Running Lighthouse (Attempt ${attempt}/3): ${targetUrl}`);
        try {
            // Added flags for stability and increased timeout
            const lighthouseCmd = `npx lighthouse ${targetUrl} --quiet --chrome-flags="--no-sandbox --headless --ignore-certificate-errors --disable-gpu --disable-dev-shm-usage" --only-categories=performance,accessibility,best-practices,seo --output=json --max-wait-for-load=60000 --throttling-method=provided --skip-audits=full-page-screenshot`;
            const result = execSync(lighthouseCmd, { stdio: ['pipe', 'pipe', 'pipe'] }).toString();
            const report = JSON.parse(result);
            const scores = {
                perf: report.categories.performance.score * 100,
                acc: report.categories.accessibility.score * 100,
                bp: report.categories['best-practices'].score * 100,
                seo: report.categories.seo.score * 100
            };
            console.log(`   - 🚀 Perf: ${scores.perf} | ♿ Acc: ${scores.acc} | 🛡️ BP: ${scores.bp} | 🔍 SEO: ${scores.seo}`);
            if (mode === 'power' && scores.perf < 40) throw new Error(`Performance too low (${scores.perf})`);
            return; // Success
        } catch (err) {
            const stderr = err.stderr ? err.stderr.toString() : '';
            const isAborted = stderr.includes('ERR_ABORTED') || err.message.includes('reliably load');
            console.warn(`   ⚠️ Lighthouse attempt ${attempt} failed: ${isAborted ? 'Page load aborted' : err.message.slice(0, 100)}`);
            if (stderr) console.error(`      Detail: ${stderr.split('\n').filter(l => l.includes('Runtime error') || l.includes('Lighthouse was unable')).join(' | ')}`);
            if (attempt === 3) {
                if (mode === 'power') throw err;
                console.warn(`   ⚠️ Skipping Lighthouse for this path after 3 failures.`);
                return;
            }
            await new Promise(r => setTimeout(r, 5000)); // Wait before retry
        }
    }
}

async function runAudit() {
  try {
    console.log(`--- [Stage 1: Health & Cache Audit] ---`);
    const res = await fetch(`${baseUrl}/health?t=${Date.now()}`, { 
        ...fetchOptions, 
        headers: { ...fetchOptions.headers, 'Cache-Control': 'no-cache' } 
    });
    const data = await res.json();
    if (!res.ok || (data.ok !== true && data.status !== 'ok')) throw new Error('Health check failed');
    console.log(`⏱️  Server Uptime: ${Math.round(data.uptime)}s`);
    if (data.timestamp) {
        console.log(`📅 Server Build Time: ${new Date(data.timestamp).toLocaleString()}`);
    }
    if (expectedVersion && expectedVersion !== 'latest' && data.version !== expectedVersion) {
        throw new Error(`VERSION MISMATCH! Found: ${data.version}, Expected: ${expectedVersion}`);
    }
    console.log(`✅ Health passed.`);

    if (mode !== 'quick') await fetchDynamicSamples();
    const internalBaseUrl = hostHeader ? 'http://127.0.0.1:3001' : (isLocal ? 'http://127.0.0.1:3001' : baseUrl);
    
    await verifyDataAPIs(internalBaseUrl);

    console.log(`\n--- [Stage 3: Deep SEO/OG Audit] ---`);
    const pathsToTest = mode === 'quick' ? auditPaths.slice(0, 1) : (mode === 'full' ? auditPaths.slice(0, 10) : auditPaths);
    for (const item of pathsToTest) {
        await verifyPathSEO(internalBaseUrl, item);
    }
    console.log(`✅ SEO Deep Audit completed for ${pathsToTest.length} paths.`);

    if (mode !== 'quick') {
        console.log(`\n--- [Stage 4: Lighthouse Audit (Sample Paths)] ---`);
        // Cap lighthouse at 5 paths even in power mode to avoid overwhelming production server
        const lighthousePaths = mode === 'power' ? pathsToTest.slice(0, 5) : pathsToTest.slice(0, 2);
        for (const item of lighthousePaths) {
            await runLighthouse(`${baseUrl}${item.path}`);
            // Small cooldown between lighthouse runs
            if (lighthousePaths.length > 1) await new Promise(r => setTimeout(r, 3000));
        }
        console.log(`✅ Lighthouse audit completed.`);
    }

    if (mode === 'power') {
        console.log(`\n--- [Stage 5: Headless UX Verification] ---`);
        execSync(`npx playwright test --config=playwright.config.mjs`, {
          env: { ...process.env, BASE_URL: baseUrl, DYNAMIC_PATHS: auditPaths.map(i => i.path).join(',') },
          stdio: 'inherit'
        });
        console.log(`✅ UX Verification: Stable.`);
    }

    console.log(`\n🏁 [SUCCESS] Xiangqi Power Gate v3.0 passed.`);
  } catch (e) {
    console.error(`❌ VERIFICATION FAILED: ${e.message}`);
    process.exit(1);
  }
}

runAudit();
