import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Image as ImageIcon,
  Megaphone,
  MessageCircle,
  Play,
  Plus,
  RefreshCw,
  Send,
  Users,
  Video,
  X,
} from 'lucide-react';

import * as campaignService from '../../services/campaignService.js';

import { Pagination } from '../../components/admin/Pagination.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';

const STATUS_VARIANT = {
  draft: 'neutral',
  scheduled: 'pending',
  processing: 'pending',
  sending: 'pending',
  running: 'pending',
  sent: 'success',
  completed: 'success',
  failed: 'danger',
  cancelled: 'neutral',
  paused: 'neutral',
};

const STATUS_LABELS = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  processing: 'Sending',
  sending: 'Sending',
  running: 'Sending',
  sent: 'Sent',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  paused: 'Paused',
};

const CUSTOMER_STATUSES = [
  { value: 'lead', label: 'Leads' },
  { value: 'prospect', label: 'Prospects' },
  { value: 'customer', label: 'Customers' },
  { value: 'repeat_customer', label: 'Repeat customers' },
  { value: 'vip', label: 'VIP customers' },
  { value: 'inactive', label: 'Inactive customers' },
];

const SOURCES = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'direct', label: 'Direct' },
  { value: 'google', label: 'Google' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
];

const CREATIVE_TYPES = [
  {
    value: 'text',
    label: 'Text only',
    description: 'Create a text-based promotional ad.',
    icon: MessageCircle,
  },
  {
    value: 'image',
    label: 'Image',
    description: 'Create an image promotional ad.',
    icon: ImageIcon,
  },
  {
    value: 'video',
    label: 'Video',
    description: 'Create a video promotional ad.',
    icon: Video,
  },
  {
    value: 'carousel',
    label: 'Carousel',
    description: 'Create multiple product or promotional cards.',
    icon: ImageIcon,
  },
];

function formatNumber(value) {
  return new Intl.NumberFormat('en-NG').format(Number(value || 0));
}

function formatPrice(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return '';
  }

  return `₦${new Intl.NumberFormat('en-NG').format(
    numericValue
  )}`;
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getCampaignStats(campaign) {
  const stats = campaign?.stats || {};

  return {
    total: Number(
      stats.targeted ??
        stats.total ??
        stats.recipients ??
        stats.audienceCount ??
        campaign?.recipientCount ??
        0
    ),

    sent: Number(stats.sent ?? stats.sentCount ?? 0),

    failed: Number(stats.failed ?? stats.failedCount ?? 0),

    pending: Number(
      stats.queued ??
        stats.pending ??
        stats.pendingCount ??
        0
    ),
  };
}

function StatusBadge({ status }) {
  const normalized = String(status || 'draft').toLowerCase();

  return (
    <Badge variant={STATUS_VARIANT[normalized] || 'neutral'}>
      {STATUS_LABELS[normalized] ||
        normalized.replaceAll('_', ' ')}
    </Badge>
  );
}

function CampaignStats({ campaign }) {
  const stats = getCampaignStats(campaign);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-xl bg-charcoal/[0.025] p-3">
        <p className="text-[10px] uppercase tracking-wide text-muted">
          Audience
        </p>

        <p className="mt-1 text-lg font-bold text-charcoal">
          {formatNumber(stats.total)}
        </p>
      </div>

      <div className="rounded-xl bg-emerald/5 p-3">
        <p className="text-[10px] uppercase tracking-wide text-muted">
          Sent
        </p>

        <p className="mt-1 text-lg font-bold text-emerald">
          {formatNumber(stats.sent)}
        </p>
      </div>

      <div className="rounded-xl bg-gold/5 p-3">
        <p className="text-[10px] uppercase tracking-wide text-muted">
          Pending
        </p>

        <p className="mt-1 text-lg font-bold text-gold-dark">
          {formatNumber(stats.pending)}
        </p>
      </div>

      <div className="rounded-xl bg-terracotta/5 p-3">
        <p className="text-[10px] uppercase tracking-wide text-muted">
          Failed
        </p>

        <p className="mt-1 text-lg font-bold text-terracotta">
          {formatNumber(stats.failed)}
        </p>
      </div>
    </div>
  );
}

function AudienceSummary({ audience }) {
  const statuses =
    audience?.customerStatus ||
    audience?.customerStatuses ||
    [];

  const sources =
    audience?.acquisitionSource ||
    audience?.sources ||
    [];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Customer status
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {statuses.length ? (
            statuses.map((status) => (
              <span
                key={status}
                className="rounded-full bg-emerald/10 px-2.5 py-1 text-xs font-medium capitalize text-emerald"
              >
                {String(status).replaceAll('_', ' ')}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted">
              All statuses
            </span>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Acquisition source
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {sources.length ? (
            sources.map((source) => (
              <span
                key={source}
                className="rounded-full bg-charcoal/[0.05] px-2.5 py-1 text-xs font-medium capitalize text-charcoal"
              >
                {String(source).replaceAll('_', ' ')}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted">
              All sources
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyCampaigns({ onCreate }) {
  return (
    <div className="flex min-h-[360px] items-center justify-center px-6 py-12 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/10 text-emerald">
          <Megaphone className="h-6 w-6" />
        </div>

        <h3 className="mt-5 text-base font-semibold text-charcoal">
          No campaigns yet
        </h3>

        <p className="mt-2 text-sm leading-6 text-muted">
          Create a promotional WhatsApp campaign, save the
          creative as a draft, then launch it when everything is
          ready.
        </p>

        <Button
          type="button"
          className="mt-5"
          onClick={onCreate}
        >
          <Plus className="h-4 w-4" />
          Create campaign
        </Button>
      </div>
    </div>
  );
}

function CreativeBadge({ creative }) {
  const type = creative?.type || 'text';

  const config = {
    text: {
      label: 'Text',
      icon: MessageCircle,
    },
    image: {
      label: 'Image',
      icon: ImageIcon,
    },
    video: {
      label: 'Video',
      icon: Video,
    },
    carousel: {
      label: 'Carousel',
      icon: ImageIcon,
    },
  };

  const current = config[type] || config.text;
  const Icon = current.icon;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-charcoal/[0.05] px-2.5 py-1 text-[10px] font-medium text-charcoal">
      <Icon className="h-3 w-3" />
      {current.label}
    </span>
  );
}

function CampaignRow({
  campaign,
  onLaunch,
  onSelect,
  onEdit,
}) {
  const stats = getCampaignStats(campaign);

  const isLaunchable = [
    'draft',
    'scheduled',
  ].includes(
    String(campaign.status || '').toLowerCase()
  );

  return (
    <div className="w-full text-left transition hover:bg-charcoal/[0.025]">
      <div className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1.7fr)_180px_160px_190px] lg:items-center">
        <button
          type="button"
          onClick={() => onSelect(campaign)}
          className="min-w-0 text-left"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
              <Megaphone className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-charcoal">
                {campaign.name || 'Untitled campaign'}
              </p>

              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                {campaign.message || 'No campaign message'}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={campaign.status} />

                <CreativeBadge
                  creative={campaign.creative}
                />

                {campaign.price > 0 && (
                  <span className="text-[11px] font-semibold text-charcoal">
                    {formatPrice(campaign.price)}
                  </span>
                )}

                <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                  <MessageCircle className="h-3 w-3" />
                  WhatsApp
                </span>
              </div>
            </div>
          </div>
        </button>

        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted">
            Audience
          </p>

          <p className="mt-1 text-sm font-semibold text-charcoal">
            {formatNumber(stats.total)}
          </p>

          <p className="mt-0.5 text-[11px] text-muted">
            {formatNumber(stats.sent)} sent
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted">
            Scheduled
          </p>

          <p className="mt-1 text-sm font-medium text-charcoal">
            {formatDate(campaign.scheduledFor)}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          {isLaunchable && (
            <>
              <button
                type="button"
                onClick={() => onEdit(campaign)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/10 px-3 py-2 text-xs font-semibold text-charcoal transition hover:bg-charcoal/[0.05]"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => onLaunch(campaign)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald px-3 py-2 text-xs font-semibold text-ivory transition hover:bg-emerald-light"
              >
                <Send className="h-3.5 w-3.5" />
                Launch
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onSelect(campaign)}
            className="rounded-lg p-2 text-muted transition hover:bg-charcoal/[0.05] hover:text-charcoal"
            aria-label="View campaign"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CreativeTypeSelector({ value, onChange }) {
  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-charcoal">
          Ad creative
        </h3>

        <p className="mt-1 text-xs text-muted">
          Choose the type of promotional ad you want to prepare.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CREATIVE_TYPES.map((creative) => {
          const Icon = creative.icon;
          const selected = value === creative.value;

          return (
            <button
              key={creative.value}
              type="button"
              onClick={() => onChange(creative.value)}
              className={`rounded-xl border p-4 text-left transition ${
                selected
                  ? 'border-emerald/30 bg-emerald/5 ring-1 ring-emerald/20'
                  : 'border-charcoal/10 hover:bg-charcoal/[0.025]'
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  selected
                    ? 'bg-emerald/10 text-emerald'
                    : 'bg-charcoal/[0.05] text-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>

              <p className="mt-3 text-sm font-semibold text-charcoal">
                {creative.label}
              </p>

              <p className="mt-1 text-[11px] leading-5 text-muted">
                {creative.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ImageCreative({ creative, setCreative }) {
  return (
    <div className="rounded-2xl border border-charcoal/10 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald/10 text-emerald">
          <ImageIcon className="h-4 w-4" />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-charcoal">
            Image ad creative
          </h3>

          <p className="mt-1 text-xs text-muted">
            Prepare the image customers will see in the ad.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <Input
          label="Image URL"
          value={creative.mediaUrl || ''}
          onChange={(event) =>
            setCreative((current) => ({
              ...current,
              mediaUrl: event.target.value,
            }))
          }
          placeholder="https://..."
        />

        {creative.mediaUrl && (
          <div className="overflow-hidden rounded-xl border border-charcoal/10 bg-charcoal/[0.025]">
            <img
              src={creative.mediaUrl}
              alt="Ad creative"
              className="max-h-72 w-full object-contain"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        <Textarea
          label="Ad caption"
          value={creative.caption || ''}
          onChange={(event) =>
            setCreative((current) => ({
              ...current,
              caption: event.target.value,
            }))
          }
          placeholder="Write the promotional caption..."
          rows={4}
          maxLength={4096}
        />
      </div>
    </div>
  );
}

function VideoCreative({ creative, setCreative }) {
  return (
    <div className="rounded-2xl border border-charcoal/10 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald/10 text-emerald">
          <Video className="h-4 w-4" />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-charcoal">
            Video ad creative
          </h3>

          <p className="mt-1 text-xs text-muted">
            Prepare the promotional video customers will see.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <Input
          label="Video URL"
          value={creative.mediaUrl || ''}
          onChange={(event) =>
            setCreative((current) => ({
              ...current,
              mediaUrl: event.target.value,
            }))
          }
          placeholder="https://..."
        />

        {creative.mediaUrl && (
          <div className="overflow-hidden rounded-xl border border-charcoal/10 bg-black">
            <video
              src={creative.mediaUrl}
              controls
              className="max-h-72 w-full"
            />
          </div>
        )}

        <Textarea
          label="Ad caption"
          value={creative.caption || ''}
          onChange={(event) =>
            setCreative((current) => ({
              ...current,
              caption: event.target.value,
            }))
          }
          placeholder="Write the promotional caption..."
          rows={4}
          maxLength={4096}
        />
      </div>
    </div>
  );
}

function CarouselCreative({ creative, setCreative }) {
  const cards = creative.cards || [];

  const addCard = () => {
    if (cards.length >= 10) return;

    setCreative((current) => ({
      ...current,
      cards: [
        ...(current.cards || []),
        {
          title: '',
          description: '',
          mediaUrl: '',
          mediaType: 'image',
          price: '',
          buttonText: 'Shop now',
          buttonUrl: '',
        },
      ],
    }));
  };

  const removeCard = (index) => {
    setCreative((current) => ({
      ...current,
      cards: (current.cards || []).filter(
        (_, cardIndex) => cardIndex !== index
      ),
    }));
  };

  const updateCard = (index, field, value) => {
    setCreative((current) => ({
      ...current,
      cards: (current.cards || []).map((card, cardIndex) =>
        cardIndex === index
          ? {
              ...card,
              [field]: value,
            }
          : card
      ),
    }));
  };

  return (
    <div className="rounded-2xl border border-charcoal/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-charcoal">
            Carousel ad creative
          </h3>

          <p className="mt-1 text-xs text-muted">
            Build multiple product or promotional cards.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addCard}
          disabled={cards.length >= 10}
        >
          <Plus className="h-4 w-4" />
          Add card
        </Button>
      </div>

      <div className="mt-4 space-y-4">
        {cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-charcoal/15 px-5 py-8 text-center">
            <ImageIcon className="mx-auto h-7 w-7 text-muted" />

            <p className="mt-3 text-sm font-medium text-charcoal">
              No carousel cards
            </p>

            <p className="mt-1 text-xs text-muted">
              Add product cards to build the ad.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={addCard}
            >
              <Plus className="h-4 w-4" />
              Add first card
            </Button>
          </div>
        ) : (
          cards.map((card, index) => (
            <div
              key={index}
              className="rounded-xl border border-charcoal/10 bg-charcoal/[0.015] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-charcoal">
                    Card {index + 1}
                  </p>

                  <p className="mt-1 text-[11px] text-muted">
                    Product or promotional item
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeCard(index)}
                  className="rounded-lg p-2 text-muted hover:bg-terracotta/10 hover:text-terracotta"
                  aria-label={`Remove card ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input
                  label="Title"
                  value={card.title || ''}
                  onChange={(event) =>
                    updateCard(
                      index,
                      'title',
                      event.target.value
                    )
                  }
                  placeholder="e.g. iPhone 15 Pro Max"
                />

                <Input
                  label="Media URL"
                  value={card.mediaUrl || ''}
                  onChange={(event) =>
                    updateCard(
                      index,
                      'mediaUrl',
                      event.target.value
                    )
                  }
                  placeholder="https://..."
                />

                <Input
                  label="Price (₦)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={card.price ?? ''}
                  onChange={(event) =>
                    updateCard(
                      index,
                      'price',
                      event.target.value
                    )
                  }
                  placeholder="45000"
                />

                <Input
                  label="Button text"
                  value={card.buttonText || ''}
                  onChange={(event) =>
                    updateCard(
                      index,
                      'buttonText',
                      event.target.value
                    )
                  }
                  placeholder="Shop now"
                />

                <div className="sm:col-span-2">
                  <Textarea
                    label="Description"
                    value={card.description || ''}
                    onChange={(event) =>
                      updateCard(
                        index,
                        'description',
                        event.target.value
                      )
                    }
                    placeholder="Describe this product..."
                    rows={3}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Button URL"
                    value={card.buttonUrl || ''}
                    onChange={(event) =>
                      updateCard(
                        index,
                        'buttonUrl',
                        event.target.value
                      )
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              {card.mediaUrl && (
                <div className="mt-4 overflow-hidden rounded-xl border border-charcoal/10 bg-white">
                  <img
                    src={card.mediaUrl}
                    alt={card.title || `Card ${index + 1}`}
                    className="max-h-48 w-full object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-4 rounded-xl bg-gold/5 p-3 text-xs leading-5 text-muted">
        The carousel structure is saved with the campaign so the
        complete promotional creative can remain in draft before
        WhatsApp delivery is launched.
      </div>
    </div>
  );
}

function CreativeEditor({ creative, setCreative }) {
  if (creative.type === 'image') {
    return (
      <ImageCreative
        creative={creative}
        setCreative={setCreative}
      />
    );
  }

  if (creative.type === 'video') {
    return (
      <VideoCreative
        creative={creative}
        setCreative={setCreative}
      />
    );
  }

  if (creative.type === 'carousel') {
    return (
      <CarouselCreative
        creative={creative}
        setCreative={setCreative}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-charcoal/10 bg-charcoal/[0.015] p-4">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-5 w-5 text-emerald" />

        <div>
          <p className="text-sm font-semibold text-charcoal">
            Text ad
          </p>

          <p className="mt-1 text-xs text-muted">
            Create a text-based promotional ad.
          </p>
        </div>
      </div>
    </div>
  );
}

/*
 * ---------------------------------------------------------
 * AD PREVIEW
 * ---------------------------------------------------------
 *
 * This replaces the old MessagePreview.
 *
 * The purpose is to show the campaign as a promotional
 * creative before it is launched.
 */
function AdPreview({ form, creative }) {
  const price = form.price;

  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-charcoal">
            Ad preview
          </h3>

          <p className="mt-1 text-xs text-muted">
            This is how your saved promotional creative is
            represented before launch.
          </p>
        </div>

        <span className="rounded-full bg-emerald/10 px-2.5 py-1 text-[10px] font-semibold text-emerald">
          Draft
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm">
        {creative.type === 'image' && creative.mediaUrl ? (
          <img
            src={creative.mediaUrl}
            alt="Ad preview"
            className="h-52 w-full object-cover"
          />
        ) : null}

        {creative.type === 'video' && creative.mediaUrl ? (
          <video
            src={creative.mediaUrl}
            controls
            className="max-h-64 w-full bg-black"
          />
        ) : null}

        {creative.type === 'carousel' ? (
          <div className="p-3">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {creative.cards?.length ? (
                creative.cards.map((card, index) => (
                  <div
                    key={index}
                    className="min-w-[220px] max-w-[220px] overflow-hidden rounded-xl border border-charcoal/10 bg-white"
                  >
                    {card.mediaUrl ? (
                      <img
                        src={card.mediaUrl}
                        alt={
                          card.title ||
                          `Card ${index + 1}`
                        }
                        className="h-36 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-36 items-center justify-center bg-charcoal/[0.025]">
                        <ImageIcon className="h-8 w-8 text-muted" />
                      </div>
                    )}

                    <div className="p-3">
                      <p className="text-sm font-semibold text-charcoal">
                        {card.title || 'Product title'}
                      </p>

                      {card.price && (
                        <p className="mt-1 text-sm font-bold text-emerald">
                          {formatPrice(card.price)}
                        </p>
                      )}

                      <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted">
                        {card.description ||
                          'Product description'}
                      </p>

                      {card.buttonText && (
                        <div className="mt-3 rounded-lg bg-emerald/10 px-3 py-2 text-center text-xs font-semibold text-emerald">
                          {card.buttonText}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex min-h-40 w-full items-center justify-center rounded-xl border border-dashed border-charcoal/15">
                  <p className="text-sm text-muted">
                    Add carousel cards to preview the ad.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {creative.type === 'text' && (
          <div className="flex min-h-44 items-center justify-center bg-charcoal/[0.025] p-6">
            <div className="max-w-sm text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-emerald" />

              <p className="mt-3 text-sm font-semibold text-charcoal">
                Text promotional ad
              </p>
            </div>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                {form.name || 'Campaign name'}
              </p>

              <h4 className="mt-1 text-base font-bold text-charcoal">
                {creative.type === 'text'
                  ? 'Promotional offer'
                  : creative.type === 'carousel'
                  ? 'Featured products'
                  : 'Special offer'}
              </h4>
            </div>

            {price && Number(price) > 0 && (
              <div className="shrink-0 rounded-xl bg-emerald/10 px-3 py-2 text-right">
                <p className="text-[9px] uppercase tracking-wide text-emerald">
                  Price
                </p>

                <p className="text-base font-bold text-emerald">
                  {formatPrice(price)}
                </p>
              </div>
            )}
          </div>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-charcoal">
            {creative.type === 'image' ||
            creative.type === 'video'
              ? creative.caption ||
                form.message ||
                'Your promotional caption will appear here.'
              : form.message ||
                'Your promotional message will appear here.'}
          </p>

          {creative.type !== 'carousel' && (
            <div className="mt-4 rounded-xl bg-emerald px-4 py-3 text-center text-xs font-semibold text-ivory">
              Shop now
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted">
        <Megaphone className="h-4 w-4 text-emerald" />
        Ad creative saved with campaign
      </div>
    </div>
  );
}

function CreateCampaignPanel({
  form,
  setForm,
  creative,
  setCreative,
  audiencePreview,
  previewLoading,
  saving,
  onPreview,
  onSave,
  onClose,
  editing,
}) {
  const selectedStatuses =
    form.audience.customerStatus || [];

  const selectedSources =
    form.audience.acquisitionSource || [];

  const toggleValue = (field, value) => {
    setForm((current) => {
      const currentValues =
        current.audience[field] || [];

      const nextValues = currentValues.includes(value)
        ? currentValues.filter(
            (item) => item !== value
          )
        : [...currentValues, value];

      return {
        ...current,
        audience: {
          ...current.audience,
          [field]: nextValues,
        },
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/40 px-4 py-6 backdrop-blur-sm sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-charcoal/10 px-5 py-5 sm:px-6">
            <div>
              <div className="flex items-center gap-2 text-emerald">
                <Megaphone className="h-5 w-5" />

                <span className="text-xs font-semibold uppercase tracking-wide">
                  WhatsApp advertising
                </span>
              </div>

              <h2 className="mt-2 font-display text-xl font-semibold text-charcoal">
                {editing
                  ? 'Edit campaign'
                  : 'Create campaign'}
              </h2>

              <p className="mt-1 text-sm text-muted">
                Build your ad, add pricing, select your audience,
                preview everything, then save it as a draft before
                launch.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-muted transition hover:bg-charcoal/[0.05] hover:text-charcoal"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <Input
                label="Campaign name"
                name="name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. New Smartphone Arrivals"
                maxLength={120}
              />

              {/* PRICE SECTION */}
              <div className="rounded-2xl border border-charcoal/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 text-gold-dark">
                    <span className="text-sm font-bold">
                      ₦
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-charcoal">
                      Offer price
                    </h3>

                    <p className="mt-1 text-xs text-muted">
                      Add the main product or promotional price
                      shown in the ad.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
                  <Input
                    label="Price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price ?? ''}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    placeholder="45000"
                  />

                  <div>
                    <label className="mb-2 block text-xs font-medium text-charcoal">
                      Currency
                    </label>

                    <div className="flex h-10 items-center rounded-lg border border-charcoal/10 bg-charcoal/[0.025] px-4 text-sm font-semibold text-charcoal">
                      NGN · ₦
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-[11px] text-muted">
                  Leave empty if this campaign does not have a
                  fixed price.
                </p>
              </div>

              <CreativeTypeSelector
                value={creative.type}
                onChange={(type) =>
                  setCreative((current) => ({
                    ...current,
                    type,
                  }))
                }
              />

              <CreativeEditor
                creative={creative}
                setCreative={setCreative}
              />

              <div>
                <Textarea
                  label={
                    creative.type === 'text'
                      ? 'Ad message'
                      : 'Additional message'
                  }
                  name="message"
                  value={form.message}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  placeholder="Write the promotional message..."
                  rows={7}
                  maxLength={4096}
                />

                <p className="mt-1 text-right text-[11px] text-muted">
                  {form.message.length}/4096
                </p>
              </div>

              <div className="rounded-2xl border border-charcoal/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-charcoal">
                      Customer status
                    </h3>

                    <p className="mt-1 text-xs text-muted">
                      Select the CRM customers you want to reach.
                    </p>
                  </div>

                  <Users className="h-5 w-5 text-muted" />
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {CUSTOMER_STATUSES.map((status) => {
                    const checked =
                      selectedStatuses.includes(
                        status.value
                      );

                    return (
                      <label
                        key={status.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${
                          checked
                            ? 'border-emerald/30 bg-emerald/5'
                            : 'border-charcoal/10 hover:bg-charcoal/[0.025]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleValue(
                              'customerStatus',
                              status.value
                            )
                          }
                          className="h-4 w-4 accent-emerald"
                        />

                        <span className="text-sm font-medium text-charcoal">
                          {status.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-charcoal/10 p-4">
                <h3 className="text-sm font-semibold text-charcoal">
                  Acquisition source
                </h3>

                <p className="mt-1 text-xs text-muted">
                  Optionally narrow the campaign by where
                  customers came from.
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {SOURCES.map((source) => {
                    const checked =
                      selectedSources.includes(
                        source.value
                      );

                    return (
                      <label
                        key={source.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${
                          checked
                            ? 'border-emerald/30 bg-emerald/5'
                            : 'border-charcoal/10 hover:bg-charcoal/[0.025]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleValue(
                              'acquisitionSource',
                              source.value
                            )
                          }
                          className="h-4 w-4 accent-emerald"
                        />

                        <span className="text-sm font-medium text-charcoal">
                          {source.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-charcoal/10 p-4">
                <div className="flex items-center gap-3">
                  <CalendarClock className="h-5 w-5 text-emerald" />

                  <div>
                    <h3 className="text-sm font-semibold text-charcoal">
                      Delivery
                    </h3>

                    <p className="mt-1 text-xs text-muted">
                      Save the creative as a draft or schedule it
                      for delivery.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Schedule"
                    value={form.scheduleMode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        scheduleMode:
                          event.target.value,
                      }))
                    }
                  >
                    <option value="now">
                      Save for immediate launch
                    </option>

                    <option value="scheduled">
                      Schedule for later
                    </option>
                  </Select>

                  {form.scheduleMode ===
                    'scheduled' && (
                    <Input
                      label="Date and time"
                      type="datetime-local"
                      value={form.scheduledFor}
                      min={new Date()
                        .toISOString()
                        .slice(0, 16)}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          scheduledFor:
                            event.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* AUDIENCE PREVIEW */}
              <div className="rounded-2xl bg-charcoal/[0.025] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Audience preview
                    </p>

                    <p className="mt-1 text-3xl font-bold text-charcoal">
                      {formatNumber(
                        audiencePreview?.count ??
                          audiencePreview?.total ??
                          0
                      )}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      customers with matching criteria
                    </p>
                  </div>

                  <Users className="h-6 w-6 text-emerald" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 w-full"
                  onClick={onPreview}
                  disabled={previewLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      previewLoading
                        ? 'animate-spin'
                        : ''
                    }`}
                  />

                  Preview audience
                </Button>
              </div>

              {/* AD PREVIEW */}
              <AdPreview
                form={form}
                creative={creative}
              />

              <div className="rounded-2xl border border-charcoal/10 p-5">
                <h3 className="text-sm font-semibold text-charcoal">
                  Draft workflow
                </h3>

                <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
                  <li>
                    • Build and preview the complete ad before
                    sending anything.
                  </li>

                  <li>
                    • The creative and price are stored with the
                    campaign.
                  </li>

                  <li>
                    • Saving keeps the campaign in draft until
                    you launch it.
                  </li>

                  <li>
                    • You can return later and edit the saved
                    creative.
                  </li>

                  <li>
                    • Only a deliberate launch sends the campaign
                    to matching customers.
                  </li>

                  <li>
                    • Media must be accessible by the WhatsApp
                    delivery service.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-charcoal/10 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={onSave}
              disabled={
                saving ||
                !form.name.trim() ||
                !form.message.trim()
              }
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {editing
                    ? 'Save changes'
                    : 'Save as draft'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignDetails({
  campaign,
  onClose,
  onLaunch,
  onEdit,
}) {
  const stats = getCampaignStats(campaign);

  const creative = campaign.creative || {
    type: 'text',
    cards: [],
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/40 px-4 py-6 backdrop-blur-sm sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="border-b border-charcoal/10 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                  <Megaphone className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate font-display text-xl font-semibold text-charcoal">
                    {campaign.name ||
                      'Untitled campaign'}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={campaign.status} />

                    <CreativeBadge
                      creative={creative}
                    />

                    {campaign.price > 0 && (
                      <span className="text-xs font-bold text-emerald">
                        {formatPrice(campaign.price)}
                      </span>
                    )}

                    <span className="text-xs text-muted">
                      WhatsApp
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-muted hover:bg-charcoal/[0.05]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            <CampaignStats campaign={campaign} />

            {/* AD CREATIVE */}
            <section>
              <h3 className="text-sm font-semibold text-charcoal">
                Ad creative
              </h3>

              <div className="mt-3 overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
                {creative.type === 'image' &&
                  creative.mediaUrl && (
                    <img
                      src={creative.mediaUrl}
                      alt="Campaign ad"
                      className="max-h-96 w-full object-contain"
                    />
                  )}

                {creative.type === 'video' &&
                  creative.mediaUrl && (
                    <video
                      src={creative.mediaUrl}
                      controls
                      className="max-h-96 w-full"
                    />
                  )}

                {creative.type === 'carousel' && (
                  <div className="grid gap-3 p-4 sm:grid-cols-2">
                    {(creative.cards || []).map(
                      (card, index) => (
                        <div
                          key={index}
                          className="overflow-hidden rounded-xl border border-charcoal/10 bg-white"
                        >
                          {card.mediaUrl && (
                            <img
                              src={card.mediaUrl}
                              alt={
                                card.title ||
                                `Card ${index + 1}`
                              }
                              className="h-40 w-full object-cover"
                            />
                          )}

                          <div className="p-3">
                            <p className="text-sm font-semibold text-charcoal">
                              {card.title ||
                                `Card ${index + 1}`}
                            </p>

                            {card.price > 0 && (
                              <p className="mt-1 text-sm font-bold text-emerald">
                                {formatPrice(card.price)}
                              </p>
                            )}

                            <p className="mt-1 text-xs leading-5 text-muted">
                              {card.description}
                            </p>

                            {card.buttonText && (
                              <div className="mt-3 rounded-lg bg-emerald/10 px-3 py-2 text-center text-xs font-semibold text-emerald">
                                {card.buttonText}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {creative.type === 'text' && (
                  <div className="flex min-h-40 items-center justify-center bg-charcoal/[0.025] p-6">
                    <div className="text-center">
                      <MessageCircle className="mx-auto h-8 w-8 text-emerald" />

                      <p className="mt-3 text-sm font-semibold text-charcoal">
                        Text promotional ad
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* PRICE */}
            {campaign.price > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-charcoal">
                  Offer price
                </h3>

                <div className="mt-3 rounded-2xl bg-emerald/5 p-4">
                  <p className="text-2xl font-bold text-emerald">
                    {formatPrice(campaign.price)}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    Main campaign offer price
                  </p>
                </div>
              </section>
            )}

            {/* MESSAGE */}
            <section>
              <h3 className="text-sm font-semibold text-charcoal">
                Ad message
              </h3>

              <div className="mt-3 rounded-2xl bg-emerald/5 p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-charcoal">
                  {campaign.message ||
                    creative.caption ||
                    'No message'}
                </p>
              </div>
            </section>

            {/* AUDIENCE */}
            <section>
              <h3 className="text-sm font-semibold text-charcoal">
                Audience
              </h3>

              <div className="mt-3 rounded-2xl border border-charcoal/10 p-4">
                <AudienceSummary
                  audience={campaign.audience || {}}
                />
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-charcoal/[0.025] p-4">
                <p className="text-xs text-muted">
                  Created
                </p>

                <p className="mt-1 text-sm font-medium text-charcoal">
                  {formatDate(campaign.createdAt)}
                </p>
              </div>

              <div className="rounded-xl bg-charcoal/[0.025] p-4">
                <p className="text-xs text-muted">
                  Scheduled for
                </p>

                <p className="mt-1 text-sm font-medium text-charcoal">
                  {formatDate(campaign.scheduledFor)}
                </p>
              </div>
            </section>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-charcoal/10 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              Close
            </Button>

            {['draft', 'scheduled'].includes(
              String(
                campaign.status || ''
              ).toLowerCase()
            ) && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onEdit(campaign)}
                >
                  Edit campaign
                </Button>

                <Button
                  type="button"
                  onClick={() => onLaunch(campaign)}
                >
                  <Send className="h-4 w-4" />
                  Launch campaign
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmLaunch({
  campaign,
  loading,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
          <Send className="h-5 w-5" />
        </div>

        <h2 className="mt-5 font-display text-xl font-semibold text-charcoal">
          Launch campaign?
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted">
          You are about to launch{' '}
          <strong className="font-semibold text-charcoal">
            {campaign?.name || 'this campaign'}
          </strong>
          . Matching customers will be queued for WhatsApp
          delivery according to the campaign schedule.
        </p>

        <div className="mt-5 space-y-3 rounded-xl bg-charcoal/[0.025] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Audience</span>

            <span className="font-semibold text-charcoal">
              {formatNumber(
                getCampaignStats(campaign).total
              )}
            </span>
          </div>

          {campaign?.price > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Offer price</span>

              <span className="font-semibold text-emerald">
                {formatPrice(campaign.price)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Confirm launch
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  name: '',
  message: '',
  price: '',
  scheduleMode: 'now',
  scheduledFor: '',
  audience: {
    customerStatus: [],
    acquisitionSource: [],
    acquisitionCampaign: '',
    tags: [],
    minTotalOrders: null,
    maxTotalOrders: null,
    minTotalSpent: null,
    maxTotalSpent: null,
    inactiveSince: null,
  },
};

const EMPTY_CREATIVE = {
  type: 'text',
  mediaUrl: '',
  mediaMimeType: '',
  mediaName: '',
  caption: '',
  cards: [],
};

function normalizeCreative(campaign) {
  const creative = campaign?.creative;

  if (!creative) {
    return {
      ...EMPTY_CREATIVE,
      type: 'text',
    };
  }

  return {
    ...EMPTY_CREATIVE,
    ...creative,
    cards: Array.isArray(creative.cards)
      ? creative.cards.map((card) => ({
          title: card.title || '',
          description: card.description || '',
          mediaUrl: card.mediaUrl || '',
          mediaType: card.mediaType || 'image',
          price: card.price ?? '',
          buttonText: card.buttonText || '',
          buttonUrl: card.buttonUrl || '',
        }))
      : [],
  };
}

export function Campaigns() {
  const [result, setResult] = useState(null);

  const [selectedCampaign, setSelectedCampaign] =
    useState(null);

  const [campaignToLaunch, setCampaignToLaunch] =
    useState(null);

  const [showCreate, setShowCreate] =
    useState(false);

  const [editingCampaign, setEditingCampaign] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [creative, setCreative] =
    useState(EMPTY_CREATIVE);

  const [audiencePreview, setAudiencePreview] =
    useState(null);

  const [previewLoading, setPreviewLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [launching, setLaunching] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [page, setPage] =
    useState(1);

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState('');

  const loadCampaigns = async () => {
    try {
      setError(null);

      const data =
        await campaignService.listCampaigns({
          page,
          search:
            search.trim() || undefined,
          status:
            status || undefined,
        });

      setResult(data);
    } catch (err) {
      setError(
        err?.message ||
          'Unable to load campaigns.'
      );
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [page, status]);

  const campaigns = result?.data || [];

  const filteredCampaigns = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) return campaigns;

    return campaigns.filter((campaign) =>
      [
        campaign.name,
        campaign.message,
        campaign.status,
        campaign.creative?.type,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        )
    );
  }, [campaigns, search]);

  const openCreate = () => {
    setEditingCampaign(null);

    setForm({
      ...EMPTY_FORM,
      audience: {
        ...EMPTY_FORM.audience,
      },
    });

    setCreative({
      ...EMPTY_CREATIVE,
      cards: [],
    });

    setAudiencePreview(null);
    setSelectedCampaign(null);
    setError(null);
    setShowCreate(true);
  };

  const openEdit = (campaign) => {
    setError(null);
    setSelectedCampaign(null);

    const scheduledFor =
      campaign.scheduledFor
        ? new Date(campaign.scheduledFor)
            .toISOString()
            .slice(0, 16)
        : '';

    setEditingCampaign(campaign);

    setForm({
      name: campaign.name || '',
      message: campaign.message || '',
      price: campaign.price ?? '',

      scheduleMode:
        scheduledFor &&
        new Date(campaign.scheduledFor) >
          new Date()
          ? 'scheduled'
          : 'now',

      scheduledFor,

      audience: {
        customerStatus:
          campaign.audience
            ?.customerStatus || [],

        acquisitionSource:
          campaign.audience
            ?.acquisitionSource || [],

        acquisitionCampaign:
          campaign.audience
            ?.acquisitionCampaign || '',

        tags:
          campaign.audience?.tags || [],

        minTotalOrders:
          campaign.audience
            ?.minTotalOrders ?? null,

        maxTotalOrders:
          campaign.audience
            ?.maxTotalOrders ?? null,

        minTotalSpent:
          campaign.audience
            ?.minTotalSpent ?? null,

        maxTotalSpent:
          campaign.audience
            ?.maxTotalSpent ?? null,

        inactiveSince:
          campaign.audience
            ?.inactiveSince || null,
      },
    });

    setCreative(
      normalizeCreative(campaign)
    );

    setAudiencePreview({
      count:
        campaign.stats?.targeted || 0,
    });

    setShowCreate(true);
  };

  const closeCreate = () => {
    if (saving) return;

    setShowCreate(false);
    setEditingCampaign(null);

    setForm({
      ...EMPTY_FORM,
      audience: {
        ...EMPTY_FORM.audience,
      },
    });

    setCreative({
      ...EMPTY_CREATIVE,
      cards: [],
    });

    setAudiencePreview(null);
  };

  const previewAudience = async () => {
    try {
      setPreviewLoading(true);
      setError(null);

      const response =
        await campaignService.previewAudience(
          form.audience
        );

      setAudiencePreview(
        response?.data ?? response
      );
    } catch (err) {
      setError(
        err?.message ||
          'Unable to preview campaign audience.'
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const validateCreative = () => {
    if (creative.type === 'text') {
      return true;
    }

    if (
      creative.type === 'image' ||
      creative.type === 'video'
    ) {
      if (!creative.mediaUrl?.trim()) {
        setError(
          `Please provide a ${
            creative.type
          } URL.`
        );

        return false;
      }

      return true;
    }

    if (creative.type === 'carousel') {
      if (
        !creative.cards ||
        creative.cards.length === 0
      ) {
        setError(
          'Add at least one carousel card.'
        );

        return false;
      }

      const invalidCard =
        creative.cards.some(
          (card) =>
            !card.mediaUrl?.trim() ||
            !card.title?.trim()
        );

      if (invalidCard) {
        setError(
          'Each carousel card needs a title and media URL.'
        );

        return false;
      }
    }

    return true;
  };

  const saveCampaign = async () => {
    if (!form.name.trim()) {
      setError(
        'Campaign name is required.'
      );

      return;
    }

    if (!form.message.trim()) {
      setError(
        'Campaign message is required.'
      );

      return;
    }

    if (!validateCreative()) {
      return;
    }

    if (
      form.price !== '' &&
      Number(form.price) < 0
    ) {
      setError(
        'Price cannot be negative.'
      );

      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: form.name.trim(),

        message:
          form.message.trim(),

        price:
          form.price === ''
            ? null
            : Number(form.price),

        channel: 'whatsapp',

        /*
         * Explicitly save as draft.
         *
         * Launching is a separate action.
         */
        status: 'draft',

        audience: form.audience,

        creative: {
          type: creative.type,

          mediaUrl:
            creative.mediaUrl?.trim() || '',

          mediaMimeType:
            creative.mediaMimeType?.trim() || '',

          mediaName:
            creative.mediaName?.trim() || '',

          caption:
            creative.caption?.trim() || '',

          cards:
            creative.type === 'carousel'
              ? creative.cards.map(
                  (card) => ({
                    title:
                      card.title?.trim() ||
                      '',

                    description:
                      card.description
                        ?.trim() || '',

                    mediaUrl:
                      card.mediaUrl
                        ?.trim() || '',

                    mediaType:
                      card.mediaType ||
                      'image',

                    price:
                      card.price === '' ||
                      card.price === null ||
                      card.price === undefined
                        ? null
                        : Number(card.price),

                    buttonText:
                      card.buttonText
                        ?.trim() || '',

                    buttonUrl:
                      card.buttonUrl
                        ?.trim() || '',
                  })
                )
              : [],
        },

        scheduledFor:
          form.scheduleMode ===
          'scheduled'
            ? form.scheduledFor
            : null,
      };

      if (editingCampaign?._id) {
        await campaignService.updateCampaign(
          editingCampaign._id,
          payload
        );
      } else {
        await campaignService.createCampaign(
          payload
        );
      }

      closeCreate();

      setPage(1);

      await loadCampaigns();
    } catch (err) {
      setError(
        err?.message ||
          'Unable to save campaign.'
      );
    } finally {
      setSaving(false);
    }
  };

  const launchCampaign = async (
    campaign
  ) => {
    setCampaignToLaunch(campaign);
    setSelectedCampaign(null);
  };

  const confirmLaunch = async () => {
    if (!campaignToLaunch?._id) {
      return;
    }

    try {
      setLaunching(true);
      setError(null);

      await campaignService.launchCampaign(
        campaignToLaunch._id
      );

      setCampaignToLaunch(null);

      await loadCampaigns();
    } catch (err) {
      setError(
        err?.message ||
          'Unable to launch campaign.'
      );
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm">
        <div className="relative px-5 py-6 sm:px-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald/[0.05] blur-2xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                  <Megaphone className="h-5 w-5" />
                </div>

                <span className="text-xs font-semibold uppercase tracking-wider text-emerald">
                  CRM & automation
                </span>
              </div>

              <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
                Campaigns
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                Build promotional WhatsApp ads, save complete
                creatives as drafts, and launch them when ready.
              </p>
            </div>

            <Button
              type="button"
              size="lg"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4" />
              Create campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <ErrorState
          message={error}
          onRetry={loadCampaigns}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(event) => {
              setSearch(
                event.target.value
              );
              setPage(1);
            }}
          />
        </div>

        <Select
          value={status}
          onChange={(event) => {
            setStatus(
              event.target.value
            );
            setPage(1);
          }}
          className="sm:w-48"
        >
          <option value="">
            All statuses
          </option>

          <option value="draft">
            Draft
          </option>

          <option value="scheduled">
            Scheduled
          </option>

          <option value="running">
            Sending
          </option>

          <option value="completed">
            Completed
          </option>

          <option value="failed">
            Failed
          </option>

          <option value="cancelled">
            Cancelled
          </option>
        </Select>

        <Button
          type="button"
          variant="outline"
          onClick={loadCampaigns}
          disabled={!result}
        >
          <RefreshCw className="h-4 w-4" />

          <span className="hidden sm:inline">
            Refresh
          </span>
        </Button>
      </div>

      {/* Campaign list */}
      <section className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm">
        <div className="border-b border-charcoal/10 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-charcoal">
                Campaign history
              </h2>

              <p className="mt-1 text-xs text-muted">
                Manage ad drafts, scheduled campaigns and
                completed WhatsApp campaigns.
              </p>
            </div>

            <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
              <Clock3 className="h-4 w-4" />
              Backend scheduled delivery
            </div>
          </div>
        </div>

        {!result && !error ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <PageSpinner />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <EmptyCampaigns
            onCreate={openCreate}
          />
        ) : (
          <>
            <div className="hidden border-b border-charcoal/10 bg-charcoal/[0.02] px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-muted lg:grid lg:grid-cols-[minmax(0,1.7fr)_180px_160px_190px]">
              <span>Campaign</span>
              <span>Audience</span>
              <span>Schedule</span>
              <span />
            </div>

            <div className="divide-y divide-charcoal/10">
              {filteredCampaigns.map(
                (campaign) => (
                  <CampaignRow
                    key={campaign._id}
                    campaign={campaign}
                    onSelect={
                      setSelectedCampaign
                    }
                    onLaunch={
                      launchCampaign
                    }
                    onEdit={openEdit}
                  />
                )
              )}
            </div>

            {result?.pagination && (
              <div className="border-t border-charcoal/10 px-5 py-4">
                <Pagination
                  page={
                    result.pagination.page
                  }
                  pages={
                    result.pagination.pages
                  }
                  onChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </section>

      {/* Create / Edit */}
      {showCreate && (
        <CreateCampaignPanel
          form={form}
          setForm={setForm}
          creative={creative}
          setCreative={setCreative}
          audiencePreview={
            audiencePreview
          }
          previewLoading={
            previewLoading
          }
          saving={saving}
          onPreview={
            previewAudience
          }
          onSave={saveCampaign}
          onClose={closeCreate}
          editing={
            Boolean(editingCampaign)
          }
        />
      )}

      {/* Details */}
      {selectedCampaign && (
        <CampaignDetails
          campaign={selectedCampaign}
          onClose={() =>
            setSelectedCampaign(null)
          }
          onLaunch={
            launchCampaign
          }
          onEdit={openEdit}
        />
      )}

      {/* Launch confirmation */}
      {campaignToLaunch && (
        <ConfirmLaunch
          campaign={
            campaignToLaunch
          }
          loading={launching}
          onCancel={() =>
            setCampaignToLaunch(null)
          }
          onConfirm={
            confirmLaunch
          }
        />
      )}
    </div>
  );
}

export default Campaigns;