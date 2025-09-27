export default {
  async fetch(req, env) {
    try {
      const url = new URL(req.url);
      if (url.pathname === '/auth/start') return startAuth(url, env);
      if (url.pathname === '/auth/callback') return handleCallback(url, env);
      if (url.pathname === '/auth/fetch') return fetchTokens(url, env);
      if (url.pathname === '/token/refresh' && req.method === 'POST') return refreshToken(req, env);
      return new Response('Not found', { status: 404 });
    } catch (e) {
      return new Response('Server error', { status: 500 });
    }
  }
};

async function startAuth(url, env) {
  const extRedirect = url.searchParams.get('ext_redirect');
  if (!extRedirect) return json({ error: 'Missing ext_redirect' }, 400);
  const state = randomString(32);
  const nonce = randomString(32);
  await env.SESSIONS.put(`state:${state}`, JSON.stringify({ extRedirect, nonce }), { expirationTtl: 300 });

  const auth = new URL('https://raindrop.io/oauth/authorize');
  auth.searchParams.set('client_id', env.RAINDROP_CLIENT_ID);
  auth.searchParams.set('redirect_uri', env.PUBLIC_BASE_URL.replace(/\/$/, '') + '/auth/callback');
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('state', state);
  return Response.redirect(auth.toString(), 302);
}

async function handleCallback(url, env) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return json({ error: 'Invalid callback' }, 400);
  const rec = await env.SESSIONS.get(`state:${state}`);
  if (!rec) return json({ error: 'Invalid state' }, 400);
  const { extRedirect } = JSON.parse(rec);

  const tokRes = await fetch('https://raindrop.io/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.RAINDROP_CLIENT_ID,
      client_secret: env.RAINDROP_CLIENT_SECRET,
      redirect_uri: env.PUBLIC_BASE_URL.replace(/\/$/, '') + '/auth/callback',
      code,
      grant_type: 'authorization_code'
    })
  });
  if (!tokRes.ok) {
    const txt = await tokRes.text();
    return json({ error: 'Token exchange failed', details: txt }, 500);
  }
  const tokens = await tokRes.json();

  const sessionCode = randomString(32);
  await env.SESSIONS.put(`sess:${sessionCode}`, JSON.stringify(tokens), { expirationTtl: 120 });
  await env.SESSIONS.delete(`state:${state}`);

  const redir = new URL(extRedirect);
  redir.searchParams.set('session_code', sessionCode);
  redir.searchParams.set('state', state);
  return Response.redirect(redir.toString(), 302);
}

async function fetchTokens(url, env) {
  const code = url.searchParams.get('session_code');
  if (!code) return json({ error: 'Missing session_code' }, 400);
  const tokens = await env.SESSIONS.get(`sess:${code}`);
  if (!tokens) return json({ error: 'Expired or invalid session_code' }, 400);
  await env.SESSIONS.delete(`sess:${code}`);
  return new Response(tokens, { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}

async function refreshToken(req, env) {
  const body = await req.json().catch(() => ({}));
  const refresh_token = body.refresh_token;
  if (!refresh_token) return json({ error: 'Missing refresh_token' }, 400);

  const res = await fetch('https://raindrop.io/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.RAINDROP_CLIENT_ID,
      client_secret: env.RAINDROP_CLIENT_SECRET,
      refresh_token,
      grant_type: 'refresh_token'
    })
  });

  const text = await res.text();
  return new Response(text, { status: res.status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}

function randomString(len) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  let s = '';
  for (let i = 0; i < len; i++) s += alphabet[arr[i] % alphabet.length];
  return s;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}

