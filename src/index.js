import { extractValues } from './tools/extract';

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		if (request.method === 'POST' && url.pathname === '/api/extract') {
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

		return new Response('ok');
	},
};
