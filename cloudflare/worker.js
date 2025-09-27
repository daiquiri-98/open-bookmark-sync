// Cloudflare Worker that provides a fixed redirect URI for the Raindrop.io OAuth flow.
const ROUTES = {
  '/auth/start': startAuth,
  '/auth/callback': handleCallback,
  '/auth/fetch': fetchTokens,
  '/token/refresh': refreshToken
};

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return handleOptions(env);

    try {
      const url = new URL(req.url);
      const handler = ROUTES[url.pathname];
      if (!handler) return textResponse('Not found', 404, env);
      return await handler(req, url, env);
    } catch (err) {
      console.error('Worker error', err);
      return textResponse('Server error', 500, env);
    }
  }
};

async function startAuth(_req, url, env) {
  const extRedirect = url.searchParams.get('ext_redirect');
  if (!extRedirect) return jsonResponse({ error: 'Missing ext_redirect' }, 400, env);

  const baseUrl = normalizeBase(env.PUBLIC_BASE_URL);
  if (!baseUrl) return jsonResponse({ error: 'PUBLIC_BASE_URL is not configured' }, 500, env);

  const state = randomString(32);
  await env.SESSIONS.put(`state:${state}`, JSON.stringify({ extRedirect }), { expirationTtl: 300 });

  const auth = new URL('https://raindrop.io/oauth/authorize');
  auth.searchParams.set('client_id', env.RAINDROP_CLIENT_ID);
  auth.searchParams.set('redirect_uri', baseUrl + '/auth/callback');
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('state', state);
  return Response.redirect(auth.toString(), 302);
}

async function handleCallback(_req, url, env) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return jsonResponse({ error: 'Invalid callback' }, 400, env);

  const session = await env.SESSIONS.get(`state:${state}`);
  if (!session) return jsonResponse({ error: 'Invalid state' }, 400, env);
  const { extRedirect } = JSON.parse(session);

  const baseUrl = normalizeBase(env.PUBLIC_BASE_URL);
  const tokenRes = await fetch('https://raindrop.io/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.RAINDROP_CLIENT_ID,
      client_secret: env.RAINDROP_CLIENT_SECRET,
      redirect_uri: baseUrl + '/auth/callback',
      code,
      grant_type: 'authorization_code'
    })
  });

  if (!tokenRes.ok) {
    const detail = await tokenRes.text();
    return jsonResponse({ error: 'Token exchange failed', details: detail }, tokenRes.status || 500, env);
  }

  const tokens = await tokenRes.json();
  const sessionCode = randomString(32);
  await env.SESSIONS.put(`sess:${sessionCode}`, JSON.stringify(tokens), { expirationTtl: 120 });
  await env.SESSIONS.delete(`state:${state}`);

  const redirect = new URL(extRedirect);
  redirect.searchParams.set('session_code', sessionCode);
  redirect.searchParams.set('state', state);
  return Response.redirect(redirect.toString(), 302);
}

async function fetchTokens(_req, url, env) {
  const code = url.searchParams.get('session_code');
  if (!code) return jsonResponse({ error: 'Missing session_code' }, 400, env);

  const tokens = await env.SESSIONS.get(`sess:${code}`);
  if (!tokens) return jsonResponse({ error: 'Expired or invalid session_code' }, 400, env);
  await env.SESSIONS.delete(`sess:${code}`);

  return new Response(tokens, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env)
    }
  });
}

async function refreshToken(req, _url, env) {
  const body = await req.json().catch(() => ({}));
  const refreshToken = body.refresh_token;
  if (!refreshToken) return jsonResponse({ error: 'Missing refresh_token' }, 400, env);

  const res = await fetch('https://raindrop.io/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.RAINDROP_CLIENT_ID,
      client_secret: env.RAINDROP_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'application/json',
      ...corsHeaders(env)
    }
  });
}

function handleOptions(env) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(env)
  });
}

function textResponse(text, status, env) {
  return new Response(text, { status, headers: corsHeaders(env) });
}

function jsonResponse(obj, status, env) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env)
    }
  });
}

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.CORS_ALLOW_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function normalizeBase(url) {
  if (!url) return null;
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function randomString(len) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[arr[i] % alphabet.length];
  return out;
}
