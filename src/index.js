import { extractValues } from './tools/extract.js';
import { getTeamGameStats } from './tools/stats.js';
import { answerUser } from './tools/answer.js';

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const DEV = env.ENABLE_DEV_ENDPOINTS === '1';

		const CORS_ORIGIN = env.FRONTEND_ORIGIN || '*';
		const CORS_HEADERS = {
			'Access-Control-Allow-Origin': CORS_ORIGIN,
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Max-Age': '86400',
			Vary: 'Origin',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: CORS_HEADERS });
		}

		// !DEV/DEBUG ENDPOINT ONLY: Not user facing
		if (request.method === 'POST' && url.pathname === '/api/extract') {
			if (!DEV) {
				return new Response('Not found', { status: 404, headers: CORS_HEADERS });
			}
			let body;
			try {
				body = await request.json();
			} catch (err) {
				return new Response('Invalid JSON body', { status: 400, headers: CORS_HEADERS });
			}

			const message = body.message;
			if (!message) {
				return Response.json({ error: "Missing 'message' data" }, { status: 400, headers: CORS_HEADERS });
			}

			const messageValues = await extractValues(env, message);
			return Response.json(messageValues, { headers: CORS_HEADERS });
		}

		// !DEV/DEBUG ENDPOINT ONLY: Not user facing
		if (request.method === 'POST' && url.pathname === '/api/stats') {
			if (!DEV) {
				return new Response('Not found', { status: 404, headers: CORS_HEADERS });
			}
			let body;
			try {
				body = await request.json();
			} catch (err) {
				return new Response('Invalid JSON body', { status: 400, headers: CORS_HEADERS });
			}

			let { sport, team: teamName, when } = body;
			if (!sport || !teamName || !when) {
				return Response.json({ error: "Missing 'sport', 'team', or 'when' identifiers" }, { status: 400, headers: CORS_HEADERS });
			}
			let stats = await getTeamGameStats(env, { sport, teamName, when });
			return Response.json(stats, { headers: CORS_HEADERS });
		}

		// User facing
		if (request.method === 'POST' && url.pathname === '/api/answer') {
			let body;
			try {
				body = await request.json();
			} catch (err) {
				return new Response('Invalid JSON body', { status: 400, headers: CORS_HEADERS });
			}

			// Make sure message is a non-empty string
			const message = typeof body?.message === 'string' ? body.message.trim() : '';
			if (!message) {
				return Response.json({ error: "Missing 'message'." }, { status: 400, headers: CORS_HEADERS });
			}

			const result = await answerUser(env, message);
			return Response.json(result, { headers: CORS_HEADERS });
		}
		return new Response('ok', { headers: CORS_HEADERS });
	},
};
