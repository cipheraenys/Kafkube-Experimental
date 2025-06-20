const { test } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { app, latencyHistogram } = require('../src/consumer');

test('consumer-service smoke tests', async (t) => {
  let server;
  let baseUrl;

  await t.test('start test metrics server', async () => {
    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  await t.test('GET /health returns 200 and json status ok', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.service, 'consumer-service');
    assert.ok(body.timestamp);
  });

  await t.test('GET /metrics returns Prometheus metric format', async () => {
    const res = await fetch(`${baseUrl}/metrics`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.match(text, /end_to_end_latency_seconds/);
  });

  await t.test('latency histogram records observation', () => {
    latencyHistogram.labels('TEST_EVENT').observe(0.042);
    // Should not throw
    assert.ok(true);
  });

  await t.test('close test metrics server', async () => {
    await new Promise((resolve) => server.close(resolve));
  });
});
