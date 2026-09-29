const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { start } = require('../index');
test('catalog, authentication, review updates and ownership', async () => {
  const server = start(0);
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(path, method = 'GET', body, cookie) {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, cookie: response.headers.get('set-cookie')?.split(';')[0], data: await response.json() };
  }
  try {
    assert.equal(Object.keys((await request('/')).data).length, 10);
    assert.equal((await request('/isbn/1')).data.title, 'Things Fall Apart');
    assert.equal(Object.keys((await request('/author/Unknown')).data).length, 4);
    assert.equal((await request('/title/Pride%20and%20Prejudice')).data['8'].author, 'Jane Austen');
    assert.deepEqual((await request('/review/1')).data, {});
    assert.equal((await request('/isbn/999')).status, 404);
    assert.equal((await request('/isbn/__proto__')).status, 404);
    assert.deepEqual((await request('/author/nobody')).data, {});
    assert.equal((await request('/register', 'POST', {})).status, 400);
    assert.equal((await request('/register', 'POST', { username: '__proto__', password: 'test' })).status, 400);
    assert.equal((await request('/customer/auth/review/1', 'PUT', { review: 'Denied' })).status, 401);
    const cookies = [];
    for (const username of ['test_alice', 'test_bob']) {
      const credentials = { username, password: 'Disposable-test-only-42' };
      assert.equal((await request('/register', 'POST', credentials)).status, 201);
      assert.equal((await request('/register', 'POST', credentials)).status, 409);
      assert.equal((await request('/customer/login', 'POST', { username, password: 'wrong' })).status, 401);
      const login = await request('/customer/login', 'POST', credentials);
      assert.equal(login.status, 200);
      assert.ok(login.cookie);
      cookies.push(login.cookie);
    }
    assert.equal((await request('/customer/auth/review/1', 'PUT', { review: '' }, cookies[0])).status, 400);
    assert.equal((await request('/customer/auth/review/999', 'PUT', { review: 'Missing' }, cookies[0])).status, 404);
    await request('/customer/auth/review/1', 'PUT', { review: 'First' }, cookies[0]);
    await request('/customer/auth/review/1', 'PUT', { review: 'Updated' }, cookies[0]);
    await request('/customer/auth/review/1', 'PUT', { review: 'Bob review' }, cookies[1]);
    assert.deepEqual((await request('/review/1')).data, { test_alice: 'Updated', test_bob: 'Bob review' });
    const removed = await request('/customer/auth/review/1', 'DELETE', undefined, cookies[0]);
    assert.deepEqual(removed.data.reviews, { test_bob: 'Bob review' });
    assert.equal((await request('/customer/auth/review/1', 'DELETE', undefined, cookies[0])).status, 404);
    await request('/customer/auth/review/1', 'DELETE', undefined, cookies[1]);
    assert.deepEqual((await request('/review/1')).data, {});
  } finally { await new Promise(resolve => server.close(resolve)); }
});
