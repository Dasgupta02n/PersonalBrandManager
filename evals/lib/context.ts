import { describeRules } from "@/lib/ai/prompts";
import type { UserContext, Win } from "@/lib/domain/types";
import type { EvalWin, Persona } from "./schema";

const pillarId = (persona: Persona, index: number) => `${persona.id}-pillar-${index + 1}`;

/**
 * The product's view of a persona: what it would know after setup and a few weeks of use,
 * including the style notebook it would have learned.
 */
export function contextFor(persona: Persona): UserContext {
  return {
    fullName: persona.name,
    headline: persona.headline,
    targetIndustries: persona.targetIndustries,
    targetRoles: persona.targetRoles,
    tone: persona.tone,
    pillars: persona.pillars.map((name, i) => ({ id: pillarId(persona, i), name, description: "" })),
    voice: {
      summary: "",
      samplePosts: persona.samplePosts,
      notes: persona.styleNotes,
      avoidWords: [],
      skippedFormats: [],
    },
    rules: persona.rules,
  };
}

export function toWin(persona: Persona, win: EvalWin): Win {
  const index = win.pillar ? persona.pillars.indexOf(win.pillar) : -1;
  return {
    id: win.id,
    occurredOn: win.occurredOn,
    summary: win.summary,
    impact: win.impact,
    metric: win.metric,
    skills: [],
    pillarId: index >= 0 ? pillarId(persona, index) : null,
    confidential: win.confidential,
    kind: win.kind,
  };
}

/**
 * What a capable user would paste into a general assistant: the same facts, rules, samples and
 * style notes the product has. The baseline gets everything the product gets except the product's
 * own prompts, checks and pipeline.
 */
export function briefFor(persona: Persona): string {
  return `About me
Name: ${persona.name}
Role: ${persona.headline} (${persona.industry}), based in ${persona.market}
I want to be known for: ${persona.pillars.join("; ")}
Audience I care about: ${[...persona.targetRoles, ...persona.targetIndustries].join(", ")}
Tone: ${persona.tone}

My rules
${describeRules(persona.rules)}

How I write
${persona.styleNotes.map((n) => `- ${n}`).join("\n")}

Posts I wrote
${persona.samplePosts.map((p, i) => `--- Sample ${i + 1} ---\n${p}`).join("\n\n")}`;
}

export function winsText(wins: EvalWin[]): string {
  return wins
    .map((w) => {
      const parts = [`[${w.id}] ${w.occurredOn} (${w.kind}): ${w.summary}`];
      if (w.impact) parts.push(`impact: ${w.impact}`);
      if (w.metric) parts.push(`metric: ${w.metric}`);
      if (w.confidential) parts.push("CONFIDENTIAL");
      return `- ${parts.join(" | ")}`;
    })
    .join("\n");
}
