---

## `docs/SCALING.md`

```markdown
# 📈 Scaling Guide

How to scale from 2 agents to 50+ and from $500 to $10K+/month.

---

## Scaling Philosophy

**Don't scale prematurely.**

Scale only when:
- ✅ Current agents are profitable
- ✅ Win rate is stable (>50%)
- ✅ You understand the system
- ✅ Resources (VPS) allow

**Quality > Quantity**

Better to have 5 profitable agents than 20 break-even agents.

---

## Scaling Roadmap

### Phase 1: Validation (Week 1-4)

**Goal:** Prove the system works

**Setup:**
- 2-3 agents
- 1 VPS (small)
- Manual approval mode

**Target:**
- First 5-10 tasks completed
- Positive profit
- Win rate >40%

**Revenue:** $200-500/month

**Actions:**
```bash
# Start with writer and coder
config/agents.json:
  agent-writer: enabled
  agent-coder: enabled
