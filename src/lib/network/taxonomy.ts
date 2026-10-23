// The fixed lists the Network setup questions, the firm directory and the suggestions share.
// Values are stored; labels are shown.

export const MARKETS = ["IN", "AE", "GB", "SG", "US"] as const;
export type Market = (typeof MARKETS)[number];
export const MARKET_LABEL: Record<Market, string> = {
  IN: "India",
  AE: "UAE",
  GB: "UK",
  SG: "Singapore",
  US: "US",
};

export const SECTORS = [
  "technology",
  "financial_services",
  "consumer",
  "industrial",
  "healthcare",
  "energy",
  "professional_services",
  "public_sector",
  "education",
  "real_estate",
  "media",
  "nonprofit",
] as const;
export type Sector = (typeof SECTORS)[number];
export const SECTOR_LABEL: Record<Sector, string> = {
  technology: "Technology",
  financial_services: "Financial services",
  consumer: "Consumer and retail",
  industrial: "Industrial and manufacturing",
  healthcare: "Healthcare and life sciences",
  energy: "Energy and resources",
  professional_services: "Professional services",
  public_sector: "Government and public sector",
  education: "Education",
  real_estate: "Real estate and infrastructure",
  media: "Media and telecoms",
  nonprofit: "Non-profit",
};

export const FUNCTIONS = [
  "general_management",
  "finance",
  "technology",
  "hr",
  "marketing",
  "sales",
  "operations",
  "legal",
  "risk",
  "strategy",
  "supply_chain",
  "product",
] as const;
export type Func = (typeof FUNCTIONS)[number];
export const FUNCTION_LABEL: Record<Func, string> = {
  general_management: "General management",
  finance: "Finance",
  technology: "Technology and digital",
  hr: "People and HR",
  marketing: "Marketing",
  sales: "Sales",
  operations: "Operations",
  legal: "Legal",
  risk: "Risk and compliance",
  strategy: "Strategy and transformation",
  supply_chain: "Supply chain",
  product: "Product",
};

export const SENIORITY = ["manager", "vp_director", "cxo", "board"] as const;
export type Seniority = (typeof SENIORITY)[number];
export const SENIORITY_LABEL: Record<Seniority, string> = {
  manager: "Manager or senior manager",
  vp_director: "Director or VP",
  cxo: "CXO or head of a business",
  board: "Board or non-executive",
};

export const TIMELINES = ["ready", "year", "now"] as const;
export type Timeline = (typeof TIMELINES)[number];
export const TIMELINE_LABEL: Record<Timeline, string> = {
  ready: "Not looking, just staying ready",
  year: "Open to a move in the next year",
  now: "Looking now, quietly",
};

export const FIRM_KINDS = ["retained", "search_and_recruitment", "recruitment", "boutique"] as const;
export type FirmKind = (typeof FIRM_KINDS)[number];
export const FIRM_KIND_LABEL: Record<FirmKind, string> = {
  retained: "Retained executive search",
  search_and_recruitment: "Search and recruitment",
  recruitment: "Professional recruitment",
  boutique: "Specialist boutique",
};

export const NETWORK_KINDS = ["search_firm", "competitor", "target_company", "peer", "other"] as const;
export type NetworkKind = (typeof NETWORK_KINDS)[number];
export const NETWORK_KIND_LABEL: Record<NetworkKind, string> = {
  search_firm: "Search firm",
  competitor: "At a competitor",
  target_company: "At a company you'd join",
  peer: "Peer or former colleague",
  other: "Other",
};

export const CONTACT_STAGES = ["to_contact", "contacted", "in_conversation", "warm", "dormant"] as const;
export type ContactStage = (typeof CONTACT_STAGES)[number];
export const STAGE_LABEL: Record<ContactStage, string> = {
  to_contact: "To contact",
  contacted: "Contacted",
  in_conversation: "In conversation",
  warm: "Warm",
  dormant: "Gone quiet",
};

export const INTERACTION_KINDS = ["message_sent", "message_received", "call", "meeting", "intro", "note"] as const;
export type InteractionKind = (typeof INTERACTION_KINDS)[number];
export const INTERACTION_LABEL: Record<InteractionKind, string> = {
  message_sent: "I sent a message",
  message_received: "They replied or wrote",
  call: "Call",
  meeting: "Met",
  intro: "Introduction",
  note: "Note",
};

export const ROLE_STAGES = ["heard", "exploring", "interviewing", "offer", "closed"] as const;
export type RoleStage = (typeof ROLE_STAGES)[number];
export const ROLE_STAGE_LABEL: Record<RoleStage, string> = {
  heard: "Heard about",
  exploring: "Exploring",
  interviewing: "Interviewing",
  offer: "Offer",
  closed: "Closed",
};

export const OUTREACH_PURPOSES = ["introduce", "reconnect", "conversation", "follow_up", "thank", "update"] as const;
export type OutreachPurpose = (typeof OUTREACH_PURPOSES)[number];
export const OUTREACH_LABEL: Record<OutreachPurpose, string> = {
  introduce: "Introduce myself",
  reconnect: "Reconnect after a while",
  conversation: "Ask for a short conversation",
  follow_up: "Follow up on our last exchange",
  thank: "Say thank you",
  update: "Share a recent piece of work",
};

export const CHANNELS = ["linkedin", "email"] as const;
export type Channel = (typeof CHANNELS)[number];
export const CHANNEL_LABEL: Record<Channel, string> = { linkedin: "LinkedIn message", email: "Email" };

/** The stage a contact moves to when this happens, if it moves forward at all. */
export function stageAfter(current: ContactStage, kind: InteractionKind): ContactStage {
  const order: ContactStage[] = ["to_contact", "contacted", "in_conversation", "warm"];
  const target: ContactStage | null =
    kind === "message_sent" ? "contacted" : kind === "message_received" || kind === "call" || kind === "meeting" || kind === "intro" ? "in_conversation" : null;
  if (!target) return current;
  if (current === "dormant") return target;
  return order.indexOf(target) > order.indexOf(current) ? target : current;
}
