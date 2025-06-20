const { test } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { app } = require('../src/app');

test('api-service smoke tests', async (t) => {
  let server;
  let baseUrl;

  await t.test('start test server', async () => {
    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  await t.test('GET / returns 200 and running text', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.match(text, /REST API Mahasiswa/);
  });

  await t.test('GET /health returns 200 and json status ok', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.service, 'api-service');
    assert.ok(body.timestamp);
  });

  await t.test('POST /api/mahasiswa without body returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/mahasiswa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
  });

  await t.test('close test server', async () => {
    await new Promise((resolve) => server.close(resolve));
  });
});
