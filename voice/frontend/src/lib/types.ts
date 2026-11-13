export type Urgence = "simple" | "note" | "urgent";

export interface Organisation {
  id: number;
  name: string;
  kind: string;
  kind_label: string;
  city: string;
  quartier: string;
  main_line: string;
  main_line_display: string;
  agent_name: string;
  greeting: string;
  greeting_en: string;
  language: string;
  language_label: string;
  tone: string;
  callback_minutes: number;
  plan: string;
  monthly_fee: number;
  sms_price: number;
  discretion: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  voice_enabled: boolean;
  auto_reminders: boolean;
  daily_log: boolean;
}

export interface Membre {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface Session {
  user: Membre;
  organization: Organisation;
  demo: boolean;
}

export interface Horaire {
  id: number;
  weekday: number;
  label: string;
  opens: string;
  closes: string;
}

export interface Touche {
  id: number;
  digit: string;
  label: string;
  action: string;
  answer_id: number | null;
  service_id: number | null;
  target_line_id: number | null;
}

export interface Ligne {
  id: number;
  label: string;
  number: string;
  number_display: string;
  position: number;
  answered_by_human: boolean;
  menu_size: number;
  schedules?: Horaire[];
  menu?: Touche[];
  week?: {
    weekday: number;
    label: string;
    windows: { opens: string; closes: string }[];
  }[];
}

export interface Fermeture {
  id: number;
  starts: string;
  ends: string;
  reason: string;
  period: string;
}

export interface Fiche {
  id: number;
  statement: string;
  keywords: string;
  body: string;
  area: string;
  follow_up: string;
  hits: number;
  updated_at: string;
  updated_label: string;
  seconde: number;
  used_by?: { digit: string; line_id: number }[];
}

export interface JourGuichet {
  weekday: number;
  label: string;
  opens: string;
  closes: string;
}

export interface Guichet {
  id: number;
  name: string;
  room: string;
  duration_min: number;
  step_min: number;
  lead_days: number;
  horizon_days: number;
  note: string;
  days: JourGuichet[];
  calendar?: JourneeLibre[];
  next?: string[];
}

export interface JourneeLibre {
  day: string;
  label: string;
  closed: boolean;
  free: number;
  first: string | null;
}

export interface RendezVous {
  id: number;
  reference: string;
  caller_name: string;
  caller_phone: string;
  caller_phone_display: string;
  service_id: number;
  service_name: string;
  room: string;
  starts_at: string;
  day: string;
  clock: string;
  duration_min: number;
  origin: string;
  status: string;
  status_label: string;
  note: string;
  reminded: boolean;
}

export interface Appel {
  id: number;
  line_id: number | null;
  line_label: string;
  caller_phone: string;
  caller_phone_display: string;
  caller_name: string;
  started_at: string;
  day: string;
  clock: string;
  ago: string;
  duration_sec: number;
  duration_label: string;
  handled: string;
  handled_label: string;
  outcome: string;
  outcome_label: string;
  digit: string;
  question: string;
  language: string;
  answer_id: number | null;
  appointment_id: number | null;
  script: string[];
}

export interface Message {
  id: number;
  line_id: number | null;
  line_label: string;
  from_name: string;
  from_phone: string;
  from_phone_display: string;
  body: string;
  urgency: Urgence;
  promised_at: string;
  promised_label: string;
  status: string;
  status_label: string;
  handled_by: string;
  handled_note: string;
  recalled_at: string | null;
  created_at: string;
  created_label: string;
  overdue: boolean;
}

export interface Envoi {
  id: number;
  channel: string;
  channel_label: string;
  to_phone: string;
  to_phone_display: string;
  subject: string;
  body: string;
  status: string;
  reference: string;
  planned_at: string;
  sent_at: string | null;
  ago: string;
}

export interface Barre {
  day: string;
  label: string;
  total: number;
  voice: number;
}

export interface PosteVivant {
  id: number;
  label: string;
  number_display: string;
  open: boolean;
  human: boolean;
  today: string;
  next: string | null;
  next_label: string;
}

export interface Tableau {
  day: string;
  calls_today: number;
  calls_by_voice: number;
  share_voice: number;
  calls_yesterday: number;
  voice_yesterday: number;
  minutes_saved: number;
  waiting_messages: number;
  overdue_messages: number;
  upcoming: RendezVous[];
  recent_calls: Appel[];
  top_answers: { id: number; statement: string; hits: number; area: string }[];
  lines: PosteVivant[];
  week: Barre[];
  closures: Fermeture[];
  week_calls: number;
  week_saturations: number;
  week_sms_cost: number;
  week_english: number;
  rush: { hour: string; calls: number; touches: { digit: string; count: number }[] };
  holes: number;
  known_numbers: number;
  next_holiday: {
    starts: string;
    reason: string;
    label: string;
    days_away: number;
  } | null;
}

export interface Ouverture {
  open: boolean;
  script: string[];
  menu: { digit: string; label: string; action: string }[];
  next_open: string | null;
}

export interface Bilan {
  call_id: number;
  moment: string;
  open: boolean;
  handled: string;
  outcome: string;
  duration_sec: number;
  script: string[];
  menu: { digit: string; label: string; action: string }[];
  slots: string[];
  answer_id: number | null;
  appointment_id: number | null;
  message_id: number | null;
  call: Appel;
}

export interface Journal {
  calls: Appel[];
  counts: Record<string, number>;
  since: string;
  days: number;
}

export interface Reglages {
  organization: Organisation;
  team: Membre[];
  lines: Ligne[];
  counters: Record<string, number>;
  demo: boolean;
  currency: string;
}

export interface Trou {
  racine: string;
  count: number;
  example: string;
  last_seen: string;
  keywords: string;
  repeated: boolean;
  suggestion: { statement: string; keywords: string; area: string };
}

export interface Trous {
  since_days: number;
  holes: Trou[];
  to_fill: number;
}

export interface Apercu {
  first: string;
  others: string[];
  english: string;
  bilingual: boolean;
  line?: string;
}
