// src/tools/answer.js
import { extractValues } from './extract.js';
import { getTeamGameStats } from './stats.js';

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

/**
 * Completes the full flow for a single user prompt:
 * > Extract entities from free text
 * > Fetch scores + stats
 * > Summarize into a short answer
 *
 * @param {any} env  - Worker env (has AI binding, secrets, etc.)
 * @param {string} userInput - e.g., "How did the Longhorns do last night?"
 * @returns {Promise<{entities:{sport:string,team:string,when:string}, scores:any, stats:any, summary:string} | {error:string}>}
 */
export async function answerUser(env, userInput) {
	if (!userInput || typeof userInput !== 'string') {
		return { error: 'Missing or invalid userInput' };
	}

	// Extract identifiers from user input
	const entities = await extractValues(env, userInput);
	if (!entities || entities.error) {
		return { error: entities?.error || 'Could not extract entities from userInput' };
	}
	const { sport, team, when } = entities || {};
	if (!sport || !team || !when) {
		return { error: 'Extraction failed- returned incomplete fields (need sport, team, when)' };
	}

	// Get scores and game stats
	const data = await getTeamGameStats(env, { sport, teamName: team, when });
	if (!data || data.error) {
		return { error: data?.error || 'Failed to fetch game data', entities };
	}
	const { scores, stats } = data;

	const messages = [
		{
			role: 'system',
			content:
				'You are a concise sports analyst that responds to user queries about football and basketball games. ' +
				'You use real game stats to answer the user queries. ' +
				'Use ONLY the JSON provided for your analysis. ' +
				'Say if the team won or lost, if they were home or away, the final score, findings on what seemed to go well or not so well, and 1-2 key stats/findings. Keep it under 70 words.',
		},
		{
			role: 'user',
			content:
				`User question: ${userInput}\n` +
				`Sport: ${sport}\n` +
				`Team: ${team}\n` +
				`When: ${when}\n\n` +
				`Scores JSON:\n${JSON.stringify(scores)}\n\n` +
				`Team Stats JSON:\n${JSON.stringify(stats)}`,
		},
	];

	const res = await env.AI.run(MODEL, { messages });
	const summary = res?.response ?? res?.result ?? '';

	return { entities, scores, stats, summary };
}
