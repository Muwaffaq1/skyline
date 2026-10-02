// The contextual weather card — exactly ONE renders at a time, the
// top-priority insight (storm > rain window > UV > wind > temp drop >
// best window > yesterday > calm). Kind-specific accent via data-kind.

import type { InsightCard as InsightCardData } from "../../lib/insights/cards";

export function ContextualCard({ card }: { card: InsightCardData }) {
  return (
    <section className="card insight-card" data-kind={card.kind} aria-label={card.title}>
      <h2 className="insight-card__title">{card.title}</h2>
      <p className="insight-card__body">{card.body}</p>
    </section>
  );
}