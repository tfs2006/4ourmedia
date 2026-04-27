# 4ourMedia Pro Personality Pack

Welcome to your Pro Personality Pack.

## Included

- Momentum profile
- Mean Reversion profile
- Capital Preservation profile
- Breakout Continuation profile
- Volatility Compression profile
- Advanced risk tuning checklist
- BYOK model switching matrix

## Setup workflow

1. Copy your bot runtime package to your host.
2. Configure broker/exchange keys in `.env`.
3. Configure AI provider key and preferred model.
4. Import one profile at a time and backtest/paper test.
5. Promote only validated profiles to live mode.

## Recommended core controls

```env
MAX_POSITIONS=6
POSITION_SIZE_PCT=0.08
MAX_HOLD_MIN=240
STOP_LOSS_PCT=2.5
TRAILING_STOP_PCT=1.4
DAILY_GOAL_ENABLED=true
DAILY_GOAL_PCT=1.0
```

## Profile rotation guidance

- Trending market: Momentum + Breakout
- Choppy market: Mean Reversion + Capital Preservation
- High uncertainty: Capital Preservation only

## Legal

Software-only product. Not investment advice. Use at your own risk.

Support: support@4ourmedia.com
