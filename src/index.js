import { extractValues } from './tools/extract.js';
import { getTeamGameStats } from './tools/stats.js';
import { answerUser } from './tools/answer.js';

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const DEV = env.ENABLE_DEV_ENDPOINTS === '1';

		// !DEV/DEBUG ENDPOINT ONLY: Not user facing
		if (request.method === 'POST' && url.pathname === '/api/extract') {
			if (!DEV) {
				return new Response('Not found', { status: 404 });
			}
			let body;
			try {
				body = await request.json();
			} catch (err) {
				return new Response('Invalid JSON body', { status: 400 });
			}

			const message = body.message;
			if (!message) {
				return Response.json({ error: "Missing 'message' data" }, { status: 400 });
			}

			const messageValues = await extractValues(env, message);
			return Response.json(messageValues, { headers: { 'Access-Control-Allow-Origin': '*' } });
		}

		// !DEV/DEBUG ENDPOINT ONLY: Not user facing
		if (request.method === 'POST' && url.pathname === '/api/stats') {
			if (!DEV) {
				return new Response('Not found', { status: 404 });
			}
			let body;
			try {
				body = await request.json();
			} catch (err) {
				return new Response('Invalid JSON body', { status: 400 });
			}

			let { sport, team: teamName, when } = body;
			if (!sport || !teamName || !when) {
				return Response.json({ error: "Missing 'sport', 'team', or 'when' identifiers" }, { status: 400 });
			}
			let stats = await getTeamGameStats(env, { sport, teamName, when });
			return Response.json(stats, { headers: { 'Access-Control-Allow-Origin': '*' } });
		}

		// User facing
		if (request.method === 'POST' && url.pathname === '/api/answer') {
			let body;
			try {
				body = await request.json();
			} catch (err) {
				return new Response('Invalid JSON body', { status: 400 });
			}

			// Make sure message is a non-empty string
			const message = typeof body?.message === 'string' ? body.message.trim() : '';
			if (!message) {
				return Response.json({ error: "Missing 'message'." }, { status: 400 });
			}

			const result = await answerUser(env, message);
			return Response.json(result, { headers: { 'Access-Control-Allow-Origin': '*' } });
		}
		return new Response('ok');
	},
};
