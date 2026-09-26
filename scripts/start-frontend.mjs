import { spawn } from 'node:child_process';

const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
const timeoutMs = Number(process.env.BACKEND_WAIT_TIMEOUT_MS || 15000);
const deadline = Date.now() + timeoutMs;
let backendReady = false;

while (Date.now() < deadline) {
  try {
    const response = await fetch(`${backendUrl}/api/health/live`, { signal: AbortSignal.timeout(1000) });
    if (response.ok) {
      backendReady = true;
      console.log(`[dev] backend ready at ${backendUrl}`);
      break;
    }
  } catch {
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}

if (!backendReady) {
  console.warn(`[dev] backend did not respond within ${timeoutMs / 1000}s; starting frontend anyway`);
}

const frontend = spawn(process.execPath, ['node_modules/vite/bin/vite.js'], {
  stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => frontend.kill(signal));
}

frontend.on('error', (error) => {
  console.error(`[dev] could not start frontend: ${error.message}`);
  process.exitCode = 1;
});
frontend.on('exit', (code) => {
  process.exitCode = code ?? 1;
});