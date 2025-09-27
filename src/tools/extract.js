const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

export async function extractValues(env, userInput = '') {
	const messages = [
		{
			role: 'system',
			content:
				'Extract sport query entities as strict JSON.' +
				'Only allow sports that belong to {nba, nfl, ncaaf}.' +
				"Map 'college football' to 'ncaaf'." +
				"Map 'basketball' to 'nba'." +
				"For when, only return 'today' or 'yesterday'." +
				"If a college team is mentioned, the name to return must be the school name (e.g. 'alabama', 'usc', 'texas', 'iowa', 'tcu', 'baylor')." +
				"If a professional team is mentioned (e.g. nfl | nba), the name to return must be their respective location and franchise name (e.g. 'phoenix suns', 'houston rockets', 'utah jazz')" +
				'If unsure, pick the most likely team from context and still return valid JSON.',
		},
		{
			role: 'user',
			content: `${userInput}\n` + 'Return ONLY JSON in the format: {"sport": "nba|nfl|ncaaf", "team": "string", "when": "today|yesterday"}',
		},
	];

	const response_format = { type: 'json_object' };

	// Returns an object
	const response = await env.AI.run(MODEL, { messages, response_format });
	let parsedResponse = JSON.parse(response.response);

	// Return clean JSON data consisting of { sport, team, when }
	return normalize(parsedResponse);
}

/*
Helper function: Clean AI JSON response, ensuring we have clean data
*/
function normalize(data = {}) {
	// Make sure we have clean data. If any field is missing, set it to empty string
	const sport = (data.sport || '').toLowerCase().trim();
	const team = (data.team || '').toLowerCase().trim();
	const when = (data.when || '').toLowerCase().trim();

	// The model may return various sport identifiers, so we need to map common identifiers
	// to the actual identifier we will be using
	const sportMap = new Map([
		['college football', 'ncaaf'],
		['ncaa football', 'ncaaf'],
		['cfb', 'ncaaf'],
		['nba', 'nba'],
		['basketball', 'nba'],
		['nfl', 'nfl'],
		['football', 'nfl'], // we will assume football == nfl
	]);

	// Set sport to appropiate identifier, default to nfl if unrecognized
	let cleanedSport;
	if (sportMap.get(sport)) {
		cleanedSport = sportMap.get(sport);
	} else if (sport === 'ncaaf' || sport === 'nba' || sport === 'nfl') {
		cleanedSport = sport;
	} else {
		cleanedSport = 'nfl'; // default to nfl if unrecognized
	}

	// Set when to today if unrecognized
	let cleanedWhen = when === 'today' || when === 'yesterday' ? when : 'today';

	return { sport: cleanedSport, team, when: cleanedWhen };
}
