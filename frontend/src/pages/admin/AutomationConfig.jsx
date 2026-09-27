import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  BellRing,
  Check,
  Clock3,
  Loader2,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  Save,
  ShoppingCart,
  Sparkles,
  Truck,
  UserCheck,
  Zap,
} from 'lucide-react';

import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import {
  getStoreSettings,
  updateStoreSettings,
} from '../../services/storeService.js';

const DEFAULT_SETTINGS = {
  automationSettings: {
    enabled: true,

    abandonedCart: {
      enabled: false,
      delayMinutes: 30,
    },

    paymentFollowUp: {
      enabled: true,
      delayMinutes: 30,
    },

    orderConfirmation: {
      enabled: true,
    },

    shippingUpdate: {
      enabled: true,
    },

    deliveryUpdate: {
      enabled: true,
    },

    postPurchase: {
      enabled: true,
      delayHours: 24,
    },
  },
};

const AUTOMATIONS = [
  {
    key: 'paymentFollowUp',
    label: 'Payment Follow-up',
    description:
      'Follow up with customers when a payment needs attention or has not completed.',
    icon: BellRing,
    accent: 'text-amber-600',
    hasDelay: true,
    delayField: 'delayMinutes',
    delayLabel: 'Delay before follow-up',
    unit: 'minutes',
    min: 1,
    max: 10080,
  },
  {
    key: 'orderConfirmation',
    label: 'Order Confirmation',
    description:
      'Automatically confirm successful orders and reassure customers that their order was received.',
    icon: PackageCheck,
    accent: 'text-emerald',
    hasDelay: false,
  },
  {
    key: 'shippingUpdate',
    label: 'Shipping Updates',
    description:
      'Notify customers when their order moves into the shipping stage.',
    icon: Truck,
    accent: 'text-blue-600',
    hasDelay: false,
  },
  {
    key: 'deliveryUpdate',
    label: 'Delivery Updates',
    description:
      'Notify customers when their order has been delivered.',
    icon: UserCheck,
    accent: 'text-green-600',
    hasDelay: false,
  },
  {
    key: 'postPurchase',
    label: 'Post-Purchase Follow-up',
    description:
      'Follow up with customers after purchase to encourage engagement, feedback and repeat purchases.',
    icon: Sparkles,
    accent: 'text-purple-600',
    hasDelay: true,
    delayField: 'delayHours',
    delayLabel: 'Delay before follow-up',
    unit: 'hours',
    min: 1,
    max: 720,
  },
];

function mergeSettings(settings) {
  const automationSettings = settings?.automationSettings || {};

  return {
    automationSettings: {
      enabled:
        typeof automationSettings.enabled === 'boolean'
          ? automationSettings.enabled
          : DEFAULT_SETTINGS.automationSettings.enabled,

      abandonedCart: {
        ...DEFAULT_SETTINGS.automationSettings.abandonedCart,
        ...(automationSettings.abandonedCart || {}),
      },

      paymentFollowUp: {
        ...DEFAULT_SETTINGS.automationSettings.paymentFollowUp,
        ...(automationSettings.paymentFollowUp || {}),
      },

      orderConfirmation: {
        ...DEFAULT_SETTINGS.automationSettings.orderConfirmation,
        ...(automationSettings.orderConfirmation || {}),
      },

      shippingUpdate: {
        ...DEFAULT_SETTINGS.automationSettings.shippingUpdate,
        ...(automationSettings.shippingUpdate || {}),
      },

      deliveryUpdate: {
        ...DEFAULT_SETTINGS.automationSettings.deliveryUpdate,
        ...(automationSettings.deliveryUpdate || {}),
      },

      postPurchase: {
        ...DEFAULT_SETTINGS.automationSettings.postPurchase,
        ...(automationSettings.postPurchase || {}),
      },
    },
  };
}

function formatDelay(value, unit) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return `— ${unit}`;
  }

  if (unit === 'hours') {
    if (number === 1) return '1 hour';
    return `${number} hours`;
  }

  if (number === 1) return '1 minute';
  return `${number} minutes`;
}

function Toggle({ enabled, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? 'Disable automation' : 'Enable automation'}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
        enabled ? 'bg-emerald' : 'bg-charcoal/15'
      } ${
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function AutomationRow({
  automation,
  settings,
  onToggle,
  onDelayChange,
  disabled,
}) {
  const Icon = automation.icon;
  const config = settings?.automationSettings?.[automation.key] || {};

  return (
    <div className="border-b border-charcoal/10 px-5 py-5 last:border-b-0">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-charcoal/5">
            <Icon className={`h-5 w-5 ${automation.accent}`} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-charcoal">
                {automation.label}
              </h3>

              <Badge
                variant={config.enabled ? 'success' : 'neutral'}
              >
                {config.enabled ? 'Active' : 'Disabled'}
              </Badge>
            </div>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              {automation.description}
            </p>

            {automation.hasDelay && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                <Clock3 className="h-4 w-4" />

                <span>
                  Current delay:{' '}
                  <span className="font-medium text-charcoal">
                    {formatDelay(
                      config[automation.delayField],
                      automation.unit
                    )}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 lg:justify-end">
          {automation.hasDelay && (
            <div className="flex items-center gap-2">
              <label
                htmlFor={`${automation.key}-delay`}
                className="text-sm text-muted"
              >
                {automation.unit === 'hours'
                  ? 'Hours'
                  : 'Minutes'}
              </label>

              <input
                id={`${automation.key}-delay`}
                type="number"
                min={automation.min}
                max={automation.max}
                step="1"
                value={config[automation.delayField] ?? ''}
                disabled={disabled || !config.enabled}
                onChange={(event) =>
                  onDelayChange(
                    automation.key,
                    automation.delayField,
                    event.target.value
                  )
                }
                className="w-24 rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal outline-none transition focus:border-emerald focus:ring-2 focus:ring-emerald/10 disabled:cursor-not-allowed disabled:bg-charcoal/5"
              />
            </div>
          )}

          <Toggle
            enabled={Boolean(config.enabled)}
            onChange={(value) =>
              onToggle(automation.key, value)
            }
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

export function AutomationConfig() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] =
    useState(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await getStoreSettings();

        if (!mounted) return;

        const normalized = mergeSettings(
          response?.data || response
        );

        setSettings(normalized);
        setOriginalSettings(normalized);
      } catch (err) {
        if (!mounted) return;

        setError(
          err?.message ||
            'Unable to load automation settings. Please try again.'
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const hasChanges = useMemo(
    () =>
      JSON.stringify(settings) !==
      JSON.stringify(originalSettings),
    [settings, originalSettings]
  );

  const enabledCount = useMemo(() => {
    return AUTOMATIONS.filter(
      (automation) =>
        settings.automationSettings?.[automation.key]?.enabled
    ).length;
  }, [settings]);

  const handleGlobalToggle = (enabled) => {
    setSuccess('');
    setError('');

    setSettings((current) => ({
      ...current,
      automationSettings: {
        ...current.automationSettings,
        enabled,
      },
    }));
  };

  const handleAutomationToggle = (key, enabled) => {
    setSuccess('');
    setError('');

    setSettings((current) => ({
      ...current,
      automationSettings: {
        ...current.automationSettings,
        [key]: {
          ...current.automationSettings[key],
          enabled,
        },
      },
    }));
  };

  const handleDelayChange = (key, field, value) => {
    setSuccess('');
    setError('');

    setSettings((current) => ({
      ...current,
      automationSettings: {
        ...current.automationSettings,
        [key]: {
          ...current.automationSettings[key],
          [field]: value === '' ? '' : Number(value),
        },
      },
    }));
  };

  const validateSettings = () => {
    const automationSettings = settings.automationSettings;

    if (!automationSettings) {
      return 'Automation settings are missing.';
    }

    const delayChecks = [
      {
        key: 'paymentFollowUp',
        field: 'delayMinutes',
        label: 'Payment Follow-up delay',
        min: 1,
        max: 10080,
      },
      {
        key: 'abandonedCart',
        field: 'delayMinutes',
        label: 'Abandoned Cart delay',
        min: 1,
        max: 10080,
      },
      {
        key: 'postPurchase',
        field: 'delayHours',
        label: 'Post-Purchase delay',
        min: 1,
        max: 720,
      },
    ];

    for (const check of delayChecks) {
      const value = Number(
        automationSettings[check.key]?.[check.field]
      );

      if (
        !Number.isFinite(value) ||
        value < check.min ||
        value > check.max
      ) {
        return `${check.label} must be between ${check.min} and ${check.max}.`;
      }
    }

    return '';
  };

  const handleSave = async () => {
    setSuccess('');
    setError('');

    const validationError = validateSettings();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        automationSettings: {
          ...settings.automationSettings,

          paymentFollowUp: {
            ...settings.automationSettings.paymentFollowUp,
            delayMinutes: Number(
              settings.automationSettings.paymentFollowUp
                .delayMinutes
            ),
          },

          abandonedCart: {
            ...settings.automationSettings.abandonedCart,
            delayMinutes: Number(
              settings.automationSettings.abandonedCart
                .delayMinutes
            ),
          },

          postPurchase: {
            ...settings.automationSettings.postPurchase,
            delayHours: Number(
              settings.automationSettings.postPurchase
                .delayHours
            ),
          },
        },
      };

      const response = await updateStoreSettings(payload);

      const normalized = mergeSettings(
        response?.data || response
      );

      setSettings(normalized);
      setOriginalSettings(normalized);
      setSuccess('Automation settings saved successfully.');
    } catch (err) {
      setError(
        err?.message ||
          'Unable to save automation settings. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setError('');
    setSuccess('');
    setSettings(originalSettings);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">
            Automation Control
          </h1>

          <p className="mt-1 text-sm text-muted">
            Configure how customer automations behave.
          </p>
        </div>

        <Card className="flex min-h-[320px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading automation settings...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="space-y-4">
        {/* Back button */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/automations"
            className="inline-flex items-center rounded-lg border border-charcoal/10 bg-white px-3 py-2 text-sm font-medium text-charcoal transition hover:bg-charcoal/5"
          >
            ← Back to Control Center
          </Link>
        </div>

        {/* Title + actions */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald/10">
                <Zap className="h-5 w-5 text-emerald" />
              </div>

              <div>
                <h1 className="font-display text-2xl font-semibold text-charcoal">
                  Automation Control
                </h1>

                <p className="mt-1 text-sm text-muted">
                  Control automated customer communication and
                  lifecycle follow-ups.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasChanges && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                disabled={saving}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            )}

            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Control Center navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-charcoal/10 pb-3">
          <Link
            to="/admin/automations"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-charcoal/5 hover:text-charcoal"
          >
            Activity
          </Link>

          <Link
            to="/admin/automations/config"
            className="rounded-lg bg-emerald/10 px-3 py-2 text-sm font-medium text-emerald"
          >
            Configuration
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-medium">
              Something went wrong
            </p>

            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald/20 bg-emerald/5 px-4 py-3 text-sm text-emerald">
          <Check className="mt-0.5 h-5 w-5" />

          <div>
            <p className="font-medium">Saved</p>

            <p className="mt-0.5">{success}</p>
          </div>
        </div>
      )}

      {/* Global automation switch */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                settings.automationSettings.enabled
                  ? 'bg-emerald/10'
                  : 'bg-charcoal/5'
              }`}
            >
              <Zap
                className={`h-5 w-5 ${
                  settings.automationSettings.enabled
                    ? 'text-emerald'
                    : 'text-muted'
                }`}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-medium text-charcoal">
                  Automation Engine
                </h2>

                <Badge
                  variant={
                    settings.automationSettings.enabled
                      ? 'success'
                      : 'neutral'
                  }
                >
                  {settings.automationSettings.enabled
                    ? 'Running'
                    : 'Paused'}
                </Badge>
              </div>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                Master switch for the store's automated customer
                lifecycle workflows.
              </p>

              <p className="mt-2 text-xs text-muted">
                {enabledCount} of {AUTOMATIONS.length} customer
                automations enabled
              </p>
            </div>
          </div>

          <Toggle
            enabled={Boolean(
              settings.automationSettings.enabled
            )}
            onChange={handleGlobalToggle}
            disabled={saving}
          />
        </div>

        {!settings.automationSettings.enabled && (
          <div className="border-t border-charcoal/10 bg-amber-50 px-5 py-3 text-sm text-amber-800">
            The automation engine is paused. Individual automation
            settings are preserved and will apply when the engine is
            enabled again.
          </div>
        )}
      </Card>

      {/* Automation settings */}
      <Card className="overflow-hidden">
        <div className="border-b border-charcoal/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-emerald" />

            <div>
              <h2 className="font-medium text-charcoal">
                Customer Automations
              </h2>

              <p className="mt-1 text-sm text-muted">
                Enable or disable individual workflows and configure
                their timing.
              </p>
            </div>
          </div>
        </div>

        {AUTOMATIONS.map((automation) => (
          <AutomationRow
            key={automation.key}
            automation={automation}
            settings={settings}
            onToggle={handleAutomationToggle}
            onDelayChange={handleDelayChange}
            disabled={saving}
          />
        ))}
      </Card>

      {/* Abandoned cart */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-terracotta/10">
              <ShoppingCart className="h-5 w-5 text-terracotta" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-medium text-charcoal">
                  Abandoned Cart Recovery
                </h2>

                <Badge
                  variant={
                    settings.automationSettings.abandonedCart
                      .enabled
                      ? 'success'
                      : 'neutral'
                  }
                >
                  {settings.automationSettings.abandonedCart
                    .enabled
                    ? 'Active'
                    : 'Disabled'}
                </Badge>
              </div>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                Recover customers who add products to their cart but
                do not complete checkout.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Clock3 className="h-4 w-4" />

                  <span>Send after</span>

                  <input
                    type="number"
                    min="1"
                    max="10080"
                    step="1"
                    value={
                      settings.automationSettings.abandonedCart
                        .delayMinutes ?? ''
                    }
                    disabled={
                      saving ||
                      !settings.automationSettings.abandonedCart
                        .enabled
                    }
                    onChange={(event) =>
                      handleDelayChange(
                        'abandonedCart',
                        'delayMinutes',
                        event.target.value
                      )
                    }
                    className="w-20 rounded-lg border border-charcoal/15 bg-white px-2.5 py-1.5 text-sm text-charcoal outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/10 disabled:cursor-not-allowed disabled:bg-charcoal/5"
                  />

                  <span>minutes</span>
                </div>
              </div>
            </div>
          </div>

          <Toggle
            enabled={Boolean(
              settings.automationSettings.abandonedCart.enabled
            )}
            onChange={(value) =>
              handleAutomationToggle(
                'abandonedCart',
                value
              )
            }
            disabled={saving}
          />
        </div>

        <div className="border-t border-charcoal/10 bg-charcoal/[0.02] px-5 py-3 text-xs leading-5 text-muted">
          Abandoned-cart recovery is disabled by default. Enable it
          only after your customer messaging and WhatsApp
          configuration are ready.
        </div>
      </Card>

      {/* Save reminder */}
      {hasChanges && (
        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-xl border border-charcoal/10 bg-white px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />

            <p className="text-sm text-charcoal">
              You have unsaved automation changes.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default AutomationConfig;
