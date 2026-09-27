<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Locked Perfect XV scoring contract

Do not change competition scoring or ranking rules without explicit project-owner approval. Fixing an implementation does not authorize redefining rules. Authoritative confirmation: "Completed Enhancements List" conversation, re-confirmed by the owner on 28 September 2026.

- Correct result: 1 point.
- Correct margin: 2 additional points.
- Exact score: 3 additional points.
- Bonuses stack; maximum 6 points per match. No half-points.
- Ranking: total points, correct results, exact scores, correct margins (all descending), then aggregate score error ascending. Complete ties share competition ranks (1, 1, 3).
- Preserve the scoring-contract regression tests. Do not rewrite their expected values simply to match changed implementation.
