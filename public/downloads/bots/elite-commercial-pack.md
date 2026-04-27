# 4ourMedia Elite Commercial Pack

Welcome to your Elite Commercial Pack.

## Included

- Full 10-profile personality library
- Commercial-ready deployment checklist
- Client onboarding template copy
- Risk governance playbook
- Update and release cadence guide

## Recommended commercial deployment model

1. Keep user API keys user-owned (non-custodial).
2. Enforce strict risk defaults in every profile.
3. Require paper mode validation before live access.
4. Track releases and maintain rollback packages.
5. Provide a signed disclaimer and support channel.

## Baseline commercial safety defaults

```env
POSITION_SIZE_PCT=0.05
MAX_POSITIONS=5
STOP_LOSS_PCT=2.0
TRAILING_STOP_PCT=1.2
SYMBOL_COOLDOWN_MIN=180
CIRCUIT_BREAKER_LOSSES=3
CIRCUIT_BREAKER_PAUSE_MIN=30
```

## Go-live checklist

- [ ] Backtest/paper test completed for each profile
- [ ] Kill switch validated
- [ ] Max loss guard validated
- [ ] API outage fallback validated
- [ ] Terms + risk disclosure published

## Legal

Software-only product. Not investment advice. No profit guarantees.

Support: support@4ourmedia.com
