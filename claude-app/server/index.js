// Small backend that keeps your Anthropic API key secret.
// The React app calls POST /api/chat; this server calls Claude and streams the reply back.
import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
app.use(express.json({ limit: '10mb' }));

// Reads ANTHROPIC_API_KEY from the environment (.env file).
const client = new Anthropic();

const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';
const SYSTEM_PROMPT = 'You are a helpful assistant.';

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: '`messages` must be a non-empty array' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).send('[Error] ANTHROPIC_API_KEY is not set. Copy claude-app/.env.example to claude-app/.env and add your key.');
  }

  // Stream plain text chunks back to the browser.
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');

  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      system: SYSTEM_PROMPT,
      output_config: { effort: 'medium' },
      // If Claude declines a request, the API retries it on a suitable fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages,
    });

    req.on('close', () => stream.abort());

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(event.delta.text);
      }
    }

    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal') {
      res.write('\n\n[Claude declined to answer this request.]');
    } else if (final.stop_reason === 'max_tokens') {
      res.write('\n\n[Response was cut off: max_tokens reached.]');
    }
    res.end();
  } catch (err) {
    console.error(err);
    let message = 'Something went wrong talking to Claude.';
    if (err instanceof Anthropic.AuthenticationError) {
      message = 'Invalid API key. Check ANTHROPIC_API_KEY in claude-app/.env';
    } else if (err instanceof Anthropic.RateLimitError) {
      message = 'Rate limited. Wait a moment and try again.';
    } else if (err instanceof Anthropic.APIError) {
      message = `Claude API error (${err.status}): ${err.message}`;
    }
    if (!res.headersSent) res.status(500);
    res.end(`\n\n[Error] ${message}`);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT} (model: ${MODEL})`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('WARNING: ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.');
  }
});
