<script setup>
import { ref, nextTick } from 'vue';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const input = ref('');
const loading = ref(false);
const error = ref('');
const messages = ref([{ role: 'assistant', content: 'Ask about NFL, NCAAF, or NBA games from today or yesterday.' }]);

// Send the user question to the backend
async function send() {
	const text = input.value.trim();
	if (!text || loading.value) return;

	error.value = '';
	messages.value.push({ role: 'user', content: text });
	input.value = '';
	loading.value = true;

	try {
		const res = await fetch(`${API_BASE}/api/answer`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message: text }),
		});

		let data = {};
		try {
			data = await res.json();
		} catch (_) {
			// Ignore JSON parse errors, will treat as generic error
		}

		// Prefer summary, if not, fall back to other options
		const reply = data.summary || data.answer || data.error || 'No response.';
		if (!res.ok || data.error) {
			error.value = data.error || `Request failed (${res.status})`;
		}
		messages.value.push({ role: 'assistant', content: reply });
	} catch (e) {
		error.value = 'Network error.';
		messages.value.push({ role: 'assistant', content: 'Error retrieving answer.' });
	} finally {
		loading.value = false;
		await nextTick();
		scrollToBottom();
	}
}

function onKey(e) {
	if (e.key === 'Enter' && !e.shiftKey) {
		e.preventDefault();
		send();
	}
}

const chatBox = ref(null);
function scrollToBottom() {
	if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight;
}
</script>

<template>
	<div class="min-vh-100 d-flex align-items-center justify-content-center bg-light">
		<div class="container">
			<!-- Center column -->
			<div class="row justify-content-center">
				<div class="col-12 col-md-8 col-lg-6">
					<!-- Card wrapper -->
					<div class="card shadow-sm">
						<div class="card-body">
							<h3 class="text-center mb-1">Sports Catchup</h3>
							<p class="text-center text-muted mb-4">Get a quick summary of your team's latest game.</p>

							<!-- Error notice -->
							<div v-if="error" class="alert alert-danger py-2 small" role="alert">
								{{ error }}
							</div>

							<!-- Messages -->
							<div ref="chatBox" class="border rounded p-3 mb-3 bg-white" style="height: 340px; overflow-y: auto; font-size: 0.95rem">
								<div
									v-for="(m, i) in messages"
									:key="i"
									class="mb-2 d-flex"
									:class="m.role === 'user' ? 'justify-content-end' : 'justify-content-start'"
								>
									<div
										class="px-3 py-2 rounded"
										:class="m.role === 'user' ? 'bg-primary text-white' : 'bg-secondary bg-opacity-10 text-dark border'"
										style="max-width: 85%; white-space: pre-wrap"
									>
										{{ m.content }}
									</div>
								</div>

								<div v-if="loading" class="text-muted small">Bot is thinking...</div>
							</div>

							<!-- Input form -->
							<form @submit.prevent="send" class="d-flex gap-2">
								<input
									v-model="input"
									@keydown="onKey"
									type="text"
									class="form-control"
									placeholder="e.g. How did the Longhorns do yesterday?"
								/>
								<button class="btn btn-primary" :disabled="loading || !input.trim()" type="submit">Send</button>
							</form>

							<div class="form-text mt-2 text-center">Endpoint: {{ API_BASE || 'same origin' }}</div>
						</div>
					</div>

					<div class="text-center mt-3 small text-muted">
						Note: Must specifiy team name and date (today or yesterday) for best responses.
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* Styles mainly just boostrap */
</style>
