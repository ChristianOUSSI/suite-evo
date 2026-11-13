export type Merchant = {
  id: number;
  name: string;
  owner_name: string;
  phone: string;
  phone_display: string;
  city: string;
  quartier: string;
  plan: string;
  monthly_target: number;
  tone: "courtois" | "ferme";
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  voice_enabled: boolean;
  auto_reminders: boolean;
  daily_report: boolean;
};

export type Session = {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  merchant: Merchant;
  demo: boolean;
};

export type Customer = {
  id: number;
  name: string;
  phone: string;
  phone_display: string;
  quartier: string;
  opt_out: boolean;
};

export type Reminder = {
  id: number;
  channel: "sms" | "whatsapp" | "voice" | string;
  channel_label: string;
  step_code: string;
  step_label: string;
  body: string;
  tone: string;
  scheduled_on: string;
  sent_at: string | null;
  status: string;
};

export type Payment = {
  id: number;
  amount: number;
  fee_amount: number;
  method: string;
  method_label: string;
  reference: string;
  phone: string;
  phone_display: string;
  paid_at: string;
  status: string;
};

export type PromiseToPay = {
  id: number;
  amount: number;
  promised_on: string;
  note: string;
  status: string;
  created_at: string;
};

export type InvoiceSummary = {
  id: number;
  reference: string;
  label: string;
  customer_name: string;
  customer_phone: string;
  customer_phone_display: string;
  amount_due: number;
  amount_paid: number;
  remaining: number;
  issued_on: string;
  due_on: string;
  days_late: number;
  stage: string;
  stage_label: string;
  status: string;
  last_contact_at: string | null;
  last_channel: string | null;
  promise_on: string | null;
  public_token: string;
};

export type InvoiceDetail = InvoiceSummary & {
  customer: Customer;
  notes: string;
  reminders: Reminder[];
  payments: Payment[];
  promises: PromiseToPay[];
  can_pay: boolean;
};

export type InvoiceList = {
  items: InvoiceSummary[];
  counts: Record<string, number>;
  total_outstanding: number;
  total_late: number;
  total_count: number;
};

export type Dashboard = {
  as_of: string;
  merchant_name: string;
  stats: {
    outstanding: number;
    overdue: number;
    collected_month: number;
    fees_month: number;
    monthly_target: number;
    monthly_progress: number;
    recovery_rate: number;
    open_count: number;
    late_count: number;
    promise_count: number;
    customers_count: number;
    planned_today: number;
    planned_channels: Record<string, number>;
    promises_due: number;
    average_days_late: number;
  };
  aging: {
    key: string;
    label: string;
    count: number;
    amount: number;
  }[];
  priorities: {
    reference: string;
    customer_name: string;
    remaining: number;
    due_on: string;
    days_late: number;
    stage: string;
    stage_label: string;
    last_contact_at: string | null;
    promise_on: string | null;
  }[];
  activity: {
    id: string;
    type: string;
    customer_name: string;
    invoice_reference: string;
    channel: string | null;
    amount: number | null;
    at: string;
    status: string;
  }[];
  collections: {
    week_start: string;
    amount: number;
  }[];
};

export type ReminderFeed = {
  items: (Reminder & {
    invoice_reference: string;
    customer_name: string;
  })[];
  sent_this_month: number;
  planned: number;
};

export type PaymentFeed = {
  items: (Payment & {
    invoice_reference: string;
    customer_name: string;
  })[];
  total: number;
  fees: number;
  count: number;
};

export type SequenceStep = {
  code: string;
  label: string;
  offset: number;
  channel: string;
  channel_label: string;
  enabled: boolean;
  description: string;
};

export type RunSummary = {
  dry_run: boolean;
  sent: number;
  skipped: number;
  by_channel: Record<string, number>;
  items: {
    invoice_reference: string;
    customer_name: string;
    channel: string;
    channel_label: string;
    body: string;
    scheduled_on: string;
  }[];
};

export type Receipt = {
  receipt: string;
  invoice_reference: string;
  merchant_name: string;
  amount: number;
  fee_amount: number;
  method: string;
  method_label: string;
  paid_at: string;
  remaining: number;
  invoice_status: string;
};

export type SettingsPayload = {
  merchant: Merchant;
  pricing: {
    subscription: number;
    fee_rate: number;
    plan_name: string;
  };
  demo_mode: boolean;
};

export type PublicInvoice = {
  merchant_name: string;
  merchant_phone_display: string;
  merchant_quartier: string;
  reference: string;
  label: string;
  customer_name: string;
  amount_due: number;
  amount_paid: number;
  remaining: number;
  due_on: string;
  days_late: number;
  stage: string;
  stage_label: string;
};
