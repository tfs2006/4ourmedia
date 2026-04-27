# 4ourMedia Starter Personality Pack

Welcome to your Starter Personality Pack.

## Included

- Momentum profile preset
- Mean Reversion profile preset
- Risk guardrail starter defaults
- BYOK AI model setup instructions

## Quick setup

1. Create a runtime folder and copy your bot engine files.
2. Add `.env` and set your own exchange/broker credentials.
3. Add your model key (OpenRouter/OpenAI/Anthropic) and model id.
4. Start in paper-trading mode first.
5. Validate max position size, daily loss cap, and emergency stop settings.

## Recommended environment variables

```env
AI_TRADING_ENABLED=true
AI_TRADING_MODEL=google/gemma-4-31b-it:free
OPENROUTER_API_KEY=your_key_here
MAX_POSITIONS=4
POSITION_SIZE_PCT=0.10
STOP_LOSS_PCT=2.0
TRAILING_STOP_PCT=1.0
```

## Personality profiles

### Momentum
- Priority: continuation entries in strong trends
- Style: faster entries, tighter invalidation
- Best for: volatile sessions with clear direction

### Mean Reversion
- Priority: pullbacks to support/VWAP zones
- Style: selective entries, wider patience
- Best for: range-bound or choppy conditions

## Legal

Software-only product. Not investment advice. Use at your own risk.

Support: support@4ourmedia.com
