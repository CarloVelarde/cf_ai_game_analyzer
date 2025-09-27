const NBA_BASE = 'https://v2.nba.api-sports.io';
const AF_BASE = 'https://v1.american-football.api-sports.io';

export async function getTeamGameStats(env, { sport, teamName, when }) {
	const date = getDate(when);
	const season = getSeasonYear(sport, new Date(), 'America/Chicago');
	let url;

	// Set league ID based on sport
	let leagueId;
	if (sport === 'nfl') {
		leagueId = 1; // NFL league ID
		url = AF_BASE;
	} else if (sport === 'ncaaf') {
		leagueId = 2; // NCAA league ID
		url = AF_BASE;
	} else if (sport === 'nba') {
		leagueId = 12; // NBA league ID
		url = NBA_BASE;
	} else {
		leagueId = null; // Unsupported sport
		url = null;
	}
   // If no valid URL or league ID, return error
	if (!url || !leagueId) {
		return { error: `Unsupported sport: ${sport}` };
	}

	let gamesForGivenDate = await getAllGamesByDate(env, url, date, leagueId);
	let updatedTeamName = await getUpdatedTeamName(env, url, teamName);
	let game = findGame(gamesForGivenDate, updatedTeamName);
	if (!game) {
		return { error: `No game found for given team ${updatedTeamName} on specified date ${date}` };
	}

	let gameID = parseGameIdFromGame(game);
	let scores = parseScoresFromGame(game);
	let stats = await getGameStats(env, url, gameID);

	return { scores, stats };
}

/*
Helper function: Get date string (YYYY-MM-DD) for 'today' or 'yesterday'
*/
function getDate(when) {
	const timeZone = 'America/Chicago';

	// Create a Date object representing "now" in that timezone
	const nowLocal = new Date(new Date().toLocaleString('en-US', { timeZone: timeZone }));

	if (when === 'yesterday') {
		nowLocal.setDate(nowLocal.getDate() - 1);
	}

	const year = nowLocal.getFullYear();
	const month = String(nowLocal.getMonth() + 1).padStart(2, '0');
	const day = String(nowLocal.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

async function getUpdatedTeamName(env, url, team) {
	const apiURL = new URL(`${url}/teams`);
	const headers = { 'x-apisports-key': env.APISPORTS_KEY };
	apiURL.searchParams.set('search', team);

	let data = await fetch(apiURL, { headers });
	let teamNames = await data.json();
	let list = Array.isArray(teamNames.response) ? teamNames.response : [];

	// If no team found, return null ID
	if (list.length === 0) {
		return { name: team, id: null };
	}
	// Make sure we have a clean team name to match against
	const q = String(team).toLowerCase().trim();
	// Holds best team name match
	let best = null;

	// Look for exact match first
	for (let t of list) {
		const name = (t.name || '').toLowerCase();
		const nick = (t.nickname || '').toLowerCase();
		if (name === q || nick === q) {
			best = t;
			break;
		}
	}
	// If no exact match, look for a partial match
	if (!best) {
		for (let t of list) {
			const name = (t.name || '').toLowerCase();
			// pick the first partial match (ex: "lakers" matches "los angeles lakers")
			if (name.includes(q)) {
				best = t;
				break;
			}
		}
	}
	// If still no match, we will simply return the first team in the list
	if (!best) best = list[0];

	return best.name;
}

/* 
Return array of games for given date and league
*/
async function getAllGamesByDate(env, url, date, leagueId) {
	const apiURL = new URL(`${url}/games?date=${date}&league=${leagueId}`);
	const headers = { 'x-apisports-key': env.APISPORTS_KEY };

	let data = await fetch(apiURL, { headers });
	let games = await data.json();
	return games.response;
}

/*
Helper function: Find a game in list of games by team name and then return the matching game object
*/
function findGame(games, team) {
	let teamName = team.toLowerCase().trim();
	for (let game of games) {
		if (game.teams.home.name.toLowerCase() === teamName || game.teams.away.name.toLowerCase() === teamName) {
			return game;
		}
	}
	return null;
}

/*
Helper function: Parse game ID from game object
*/
function parseGameIdFromGame(game) {
	return game.game.id;
}

/*
 * Helper function: Parse scores from game object
 */
function parseScoresFromGame(game) {
	return game.scores;
}

async function getGameStats(env, url, gameID) {
	const apiURL = new URL(`${url}/games/statistics/teams?id=${gameID}`);
	const headers = { 'x-apisports-key': env.APISPORTS_KEY };

	let data = await fetch(apiURL, { headers });
	let stats = await data.json();
	return stats.response;
}

/*
Helper function: Get the season year based on what sport and the month.
Ex: for basketball, the season starts in October, so if its January 2026, the season is actually 2025.
*/
function getSeasonYear(sport, dateInput = new Date(), tz = 'America/Chicago') {
	const currentDate = new Date(new Date(dateInput).toLocaleString('en-US', { timeZone: tz }));
	const y = currentDate.getFullYear();
	const m = currentDate.getMonth() + 1;

	// NFL/CFB: Aug -> season year
	if (sport === 'nfl' || sport === 'ncaaf') {
		return m >= 8 ? y : y - 1;
	}
	// NBA: Oct -> season year
	if (sport === 'nba') {
		return m >= 10 ? y : y - 1;
	}
	return y;
}
