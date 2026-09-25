const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
const timeoutMs = Number(process.env.BACKEND_WAIT_TIMEOUT_MS || 120000);
const retryMs = 250;
const deadline = Date.now() + timeoutMs;

while (Date.now() < deadline) {
  try {
    const response = await fetch(`${backendUrl}/api/health/live`, { signal: AbortSignal.timeout(1000) });
    if (response.ok) {
      console.log(`[dev] backend ready at ${backendUrl}`);
      process.exit(0);
    }
  } catch {
  }
  await new Promise((resolve) => setTimeout(resolve, retryMs));
}

console.error(`[dev] backend did not become ready within ${timeoutMs / 1000}s: ${backendUrl}
[dev] Look at the BACKEND lines above for the real reason. The usual causes are:
[dev]   - MongoDB is not running (start the MongoDB service, or: docker run -d -p 27017:27017 mongo:8)
[dev]   - backend/.env is missing or a required value is empty (copy backend/.env.example)
[dev]   - port 5000 is used by another program (change PORT in backend/.env and set BACKEND_URL)`);
process.exit(1);
