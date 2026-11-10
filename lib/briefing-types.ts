export const MEETING_TYPES = [
  'Sales Call',
  'Partnership',
  'Investor Pitch',
  'Business Development',
  'General',
] as const;

export type MeetingType = (typeof MEETING_TYPES)[number];

export const GATEWAY_MODELS = [
  { value: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash' },
] as const;

export type GatewayModel = (typeof GATEWAY_MODELS)[number]['value'];

export const DEVELOPMENT_CATEGORIES = [
  'Launch',
  'Hire',
  'Funding',
  'Partnership',
  'Press',
] as const;

export type DevelopmentCategory = (typeof DEVELOPMENT_CATEGORIES)[number];

export type Confidence = 'High' | 'Medium' | 'Low';

export interface Source {
  id: number;
  title: string;
  url: string;
  publishedDate: string;
}

export interface Development {
  date: string | null;
  category: DevelopmentCategory;
  title: string;
  detail: string;
  sourceUrl: string;
  sourceTitle: string;
}

export interface Briefing {
  executiveSummary: string;
  developments: Development[];
  discussionPoints: string[];
  openQuestions: string[];
  confidence: Confidence;
  sources: Source[];
}

export interface BriefingMeta {
  target: string;
  meetingType: MeetingType;
  meetingAt: Date;
  model: GatewayModel;
}

export interface SavedBriefing {
  id: string;
  createdAt: string;
  meta: BriefingMeta;
  briefing: Briefing;
}
