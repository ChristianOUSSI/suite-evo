from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from .utils import normalize_phone


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str


class MerchantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    owner_name: str
    phone: str
    phone_display: str
    city: str
    quartier: str
    plan: str
    monthly_target: int
    tone: str
    sms_enabled: bool
    whatsapp_enabled: bool
    voice_enabled: bool
    auto_reminders: bool
    daily_report: bool


class SessionOut(BaseModel):
    user: UserOut
    merchant: MerchantOut
    demo: bool


class CustomerOut(BaseModel):
    id: int
    name: str
    phone: str
    phone_display: str
    quartier: str
    opt_out: bool


class ReminderOut(BaseModel):
    id: int
    channel: str
    channel_label: str
    step_code: str
    step_label: str
    body: str
    tone: str
    scheduled_on: date
    sent_at: datetime | None
    status: str


class PaymentOut(BaseModel):
    id: int
    amount: int
    fee_amount: int
    method: str
    method_label: str
    reference: str
    phone: str
    phone_display: str
    paid_at: datetime
    status: str


class PromiseOut(BaseModel):
    id: int
    amount: int
    promised_on: date
    note: str
    status: str
    created_at: datetime


class InvoiceSummaryOut(BaseModel):
    id: int
    reference: str
    label: str
    customer_name: str
    customer_phone: str
    customer_phone_display: str
    amount_due: int
    amount_paid: int
    remaining: int
    issued_on: date
    due_on: date
    days_late: int
    stage: str
    stage_label: str
    status: str
    last_contact_at: datetime | None
    last_channel: str | None
    promise_on: date | None
    public_token: str


class InvoiceDetailOut(InvoiceSummaryOut):
    customer: CustomerOut
    notes: str
    reminders: list[ReminderOut]
    payments: list[PaymentOut]
    promises: list[PromiseOut]
    can_pay: bool


class InvoiceListOut(BaseModel):
    items: list[InvoiceSummaryOut]
    counts: dict[str, int]
    total_outstanding: int
    total_late: int
    total_count: int


class AgingBucketOut(BaseModel):
    key: str
    label: str
    count: int
    amount: int


class ActivityOut(BaseModel):
    id: str
    type: str
    customer_name: str
    invoice_reference: str
    channel: str | None
    amount: int | None
    at: datetime
    status: str


class PriorityInvoiceOut(BaseModel):
    reference: str
    customer_name: str
    remaining: int
    due_on: date
    days_late: int
    stage: str
    stage_label: str
    last_contact_at: datetime | None
    promise_on: date | None


class CollectionPointOut(BaseModel):
    week_start: date
    amount: int


class DashboardStatsOut(BaseModel):
    outstanding: int
    overdue: int
    collected_month: int
    fees_month: int
    monthly_target: int
    monthly_progress: int
    recovery_rate: int
    open_count: int
    late_count: int
    promise_count: int
    customers_count: int
    planned_today: int
    planned_channels: dict[str, int]
    promises_due: int
    average_days_late: int


class DashboardOut(BaseModel):
    as_of: date
    merchant_name: str
    stats: DashboardStatsOut
    aging: list[AgingBucketOut]
    priorities: list[PriorityInvoiceOut]
    activity: list[ActivityOut]
    collections: list[CollectionPointOut]


class InvoiceCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=140)
    phone: str
    label: str = Field(min_length=2, max_length=200)
    amount_due: int = Field(gt=0, le=500_000_000)
    due_on: date
    quartier: str = Field(default="", max_length=100)
    notes: str = Field(default="", max_length=2000)

    @field_validator("phone")
    @classmethod
    def valid_phone(cls, value: str) -> str:
        normalized = normalize_phone(value)
        if not normalized:
            raise ValueError("Numéro camerounais invalide (ex. 6 77 08 41 96).")
        return normalized


class ImportRow(BaseModel):
    customer_name: str = Field(min_length=2, max_length=140)
    phone: str
    label: str = Field(min_length=2, max_length=200)
    amount_due: int = Field(gt=0, le=500_000_000)
    due_on: date
    quartier: str = Field(default="", max_length=100)
    notes: str = Field(default="", max_length=1000)

    @field_validator("phone")
    @classmethod
    def valid_phone(cls, value: str) -> str:
        normalized = normalize_phone(value)
        if not normalized:
            raise ValueError("Numéro invalide")
        return normalized


class ImportRequest(BaseModel):
    rows: list[ImportRow] = Field(min_length=1, max_length=500)


class ImportErrorOut(BaseModel):
    row: int
    message: str


class ImportDuplicateOut(BaseModel):
    row: int
    reference: str | None = None


class ImportCheckOut(BaseModel):
    duplicates: list[ImportDuplicateOut]


class ImportResultOut(BaseModel):
    imported: int
    skipped: int
    errors: list[ImportErrorOut]
    invoices: list[str]


class PromiseCreate(BaseModel):
    amount: int = Field(gt=0)
    promised_on: date
    note: str = Field(default="", max_length=240)


class InvoiceStatusPatch(BaseModel):
    status: Literal["open", "disputed"]


class RunItemOut(BaseModel):
    invoice_reference: str
    customer_name: str
    channel: str
    channel_label: str
    body: str
    scheduled_on: date


class RunSummaryOut(BaseModel):
    dry_run: bool
    sent: int
    skipped: int
    by_channel: dict[str, int]
    items: list[RunItemOut]


class DirectReminderOut(BaseModel):
    reminder: ReminderOut
    invoice_reference: str
    customer_name: str


class ReminderFeedItemOut(ReminderOut):
    invoice_reference: str
    customer_name: str


class ReminderFeedOut(BaseModel):
    items: list[ReminderFeedItemOut]
    sent_this_month: int
    planned: int


class SequenceStepOut(BaseModel):
    code: str
    label: str
    offset: int
    channel: str
    channel_label: str
    enabled: bool
    description: str


class PaymentFeedItemOut(PaymentOut):
    invoice_reference: str
    customer_name: str


class PaymentFeedOut(BaseModel):
    items: list[PaymentFeedItemOut]
    total: int
    fees: int
    count: int


class ManualPaymentIn(BaseModel):
    amount: int = Field(gt=0)
    method: Literal["cash", "momo_mtn", "momo_orange"] = "cash"
    phone: str | None = None


class PublicInvoiceOut(BaseModel):
    merchant_name: str
    merchant_phone_display: str
    merchant_quartier: str
    reference: str
    label: str
    customer_name: str
    amount_due: int
    amount_paid: int
    remaining: int
    due_on: date
    days_late: int
    stage: str
    stage_label: str


class PublicPayIn(BaseModel):
    amount: int = Field(gt=0)
    method: Literal["momo_mtn", "momo_orange"]
    phone: str

    @field_validator("phone")
    @classmethod
    def valid_phone(cls, value: str) -> str:
        normalized = normalize_phone(value)
        if not normalized or not normalized.startswith("+2376"):
            raise ValueError("Un numéro mobile camerounais est requis.")
        return normalized


class ReceiptOut(BaseModel):
    receipt: str
    invoice_reference: str
    merchant_name: str
    amount: int
    fee_amount: int
    method: str
    method_label: str
    paid_at: datetime
    remaining: int
    invoice_status: str


class PricingOut(BaseModel):
    subscription: int
    fee_rate: int
    plan_name: str


class SettingsOut(BaseModel):
    merchant: MerchantOut
    pricing: PricingOut
    demo_mode: bool


class SettingsPatch(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=140)
    owner_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = None
    quartier: str | None = Field(default=None, max_length=100)
    monthly_target: int | None = Field(default=None, gt=0, le=500_000_000)
    tone: Literal["courtois", "ferme"] | None = None
    sms_enabled: bool | None = None
    whatsapp_enabled: bool | None = None
    voice_enabled: bool | None = None
    auto_reminders: bool | None = None
    daily_report: bool | None = None

    @field_validator("phone")
    @classmethod
    def valid_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = normalize_phone(value)
        if not normalized:
            raise ValueError("Numéro camerounais invalide.")
        return normalized
