import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { Card } from '../../components/ui/Card.jsx';
import * as storeService from '../../services/storeService.js';
import { changePassword } from '../../services/authService.js';

export function Settings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    storeService
      .getStoreSettings()
      .then(setForm)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateNested = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    setPasswordMessage('');
    setPasswordError('');

    if (!passwordForm.currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }

    if (!passwordForm.newPassword) {
      setPasswordError('New password is required.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    setPasswordSaving(true);

    try {
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setPasswordMessage('Password changed successfully.');
    } catch (error) {
      setPasswordError(error.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const updated = await storeService.updateStoreSettings(form);

      setForm(updated);
      setMessage('Store settings updated successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (error && !form) return <ErrorState message={error} />;

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">
          Store Settings
        </h1>

        <p className="mt-1 text-sm text-muted">
          Manage your store information, social media, opening hours,
          orders, payments, delivery and WhatsApp settings.
        </p>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-xl bg-emerald/10 px-4 py-3 text-sm text-emerald">
          {message}
        </div>
      )}

      {/* STORE SETTINGS FORM */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* STORE INFORMATION */}
        <Card>
          <h2 className="font-display text-lg font-semibold text-charcoal">
            Store Information
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input
              label="Store name"
              value={form.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
            />

            <Input
              label="Store slug"
              value={form.slug || ''}
              onChange={(e) => updateField('slug', e.target.value)}
            />

            <Input
              label="Logo URL"
              value={form.logoUrl || ''}
              onChange={(e) => updateField('logoUrl', e.target.value)}
            />

            <Select
              label="Currency"
              value={form.currency || 'NGN'}
              onChange={(e) => updateField('currency', e.target.value)}
            >
              <option value="NGN">NGN — Nigerian Naira</option>
              <option value="USD">USD — US Dollar</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="EUR">EUR — Euro</option>
            </Select>

            <Select
              label="Store status"
              value={form.status || 'active'}
              onChange={(e) => updateField('status', e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </Card>

        {/* CONTACT */}
        <Card>
          <h2 className="font-display text-lg font-semibold text-charcoal">
            Contact & Business Address
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input
              label="Email"
              type="email"
              value={form.contact?.email || ''}
              onChange={(e) =>
                updateNested('contact', 'email', e.target.value)
              }
            />

            <Input
              label="Phone"
              value={form.contact?.phone || ''}
              onChange={(e) =>
                updateNested('contact', 'phone', e.target.value)
              }
            />

            <Input
              label="Business address"
              value={form.contact?.address || ''}
              onChange={(e) =>
                updateNested('contact', 'address', e.target.value)
              }
              className="md:col-span-2"
            />
          </div>
        </Card>

        {/* SOCIAL MEDIA */}
        <Card>
          <h2 className="font-display text-lg font-semibold text-charcoal">
            Social Media Links
          </h2>

          <p className="mt-1 text-sm text-muted">
            Add the links customers should use to find your business online.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input
              label="Instagram"
              placeholder="https://instagram.com/..."
              value={form.social?.instagram || ''}
              onChange={(e) =>
                updateNested('social', 'instagram', e.target.value)
              }
            />

            <Input
              label="Facebook"
              placeholder="https://facebook.com/..."
              value={form.social?.facebook || ''}
              onChange={(e) =>
                updateNested('social', 'facebook', e.target.value)
              }
            />

            <Input
              label="TikTok"
              placeholder="https://tiktok.com/@..."
              value={form.social?.tiktok || ''}
              onChange={(e) =>
                updateNested('social', 'tiktok', e.target.value)
              }
            />

            <Input
              label="Twitter / X"
              placeholder="https://x.com/..."
              value={form.social?.twitter || ''}
              onChange={(e) =>
                updateNested('social', 'twitter', e.target.value)
              }
            />

            <Input
              label="YouTube"
              placeholder="https://youtube.com/..."
              value={form.social?.youtube || ''}
              onChange={(e) =>
                updateNested('social', 'youtube', e.target.value)
              }
            />
          </div>
        </Card>

        {/* OPENING HOURS */}
        <Card>
          <h2 className="font-display text-lg font-semibold text-charcoal">
            Opening Hours
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              'monday',
              'tuesday',
              'wednesday',
              'thursday',
              'friday',
              'saturday',
              'sunday',
            ].map((day) => (
              <Input
                key={day}
                label={day.charAt(0).toUpperCase() + day.slice(1)}
                placeholder="e.g. 9:00 AM - 6:00 PM"
                value={form.hours?.[day] || ''}
                onChange={(e) =>
                  updateNested('hours', day, e.target.value)
                }
              />
            ))}
          </div>
        </Card>

        {/* ORDER SETTINGS */}
        <Card>
          <h2 className="font-display text-lg font-semibold text-charcoal">
            Order Settings
          </h2>

          <div className="mt-5 space-y-4">
            <label className="flex items-center gap-3 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={form.orderSettings?.allowGuestCheckout ?? true}
                onChange={(e) =>
                  updateNested(
                    'orderSettings',
                    'allowGuestCheckout',
                    e.target.checked
                  )
                }
                className="h-4 w-4 accent-emerald"
              />
              Allow guest checkout
            </label>

            <label className="flex items-center gap-3 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={
                  form.orderSettings?.allowOrderCancellation ?? true
                }
                onChange={(e) =>
                  updateNested(
                    'orderSettings',
                    'allowOrderCancellation',
                    e.target.checked
                  )
                }
                className="h-4 w-4 accent-emerald"
              />
              Allow customers to cancel orders
            </label>

            <div className="max-w-sm">
              <Input
                label="Minimum order amount"
                type="number"
                min="0"
                value={form.orderSettings?.minimumOrderAmount ?? 0}
                onChange={(e) =>
                  updateNested(
                    'orderSettings',
                    'minimumOrderAmount',
                    Number(e.target.value)
                  )
                }
              />
            </div>
          </div>
        </Card>

        {/* PAYMENT SETTINGS */}
        <Card>
          <h2 className="font-display text-lg font-semibold text-charcoal">
            Payment Settings
          </h2>

          <div className="mt-5 space-y-4">
            <label className="flex items-center gap-3 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={
                  form.paymentSettings?.paystackEnabled ?? true
                }
                onChange={(e) =>
                  updateNested(
                    'paymentSettings',
                    'paystackEnabled',
                    e.target.checked
                  )
                }
                className="h-4 w-4 accent-emerald"
              />
              Enable Paystack
            </label>

            <label className="flex items-center gap-3 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={
                  form.paymentSettings?.cashOnDelivery ?? false
                }
                onChange={(e) =>
                  updateNested(
                    'paymentSettings',
                    'cashOnDelivery',
                    e.target.checked
                  )
                }
                className="h-4 w-4 accent-emerald"
              />
              Allow cash on delivery
            </label>

            <label className="flex items-center gap-3 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={
                  form.paymentSettings?.bankTransfer ?? false
                }
                onChange={(e) =>
                  updateNested(
                    'paymentSettings',
                    'bankTransfer',
                    e.target.checked
                  )
                }
                className="h-4 w-4 accent-emerald"
              />
              Allow bank transfer
            </label>
          </div>
        </Card>

        {/* DELIVERY SETTINGS */}
        <Card>
          <h2 className="font-display text-lg font-semibold text-charcoal">
            Delivery Settings
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input
              label="Delivery fee"
              type="number"
              min="0"
              value={form.deliverySettings?.deliveryFee ?? 0}
              onChange={(e) =>
                updateNested(
                  'deliverySettings',
                  'deliveryFee',
                  Number(e.target.value)
                )
              }
            />

            <Input
              label="Free delivery threshold"
              type="number"
              min="0"
              value={
                form.deliverySettings?.freeDeliveryThreshold ?? ''
              }
              onChange={(e) =>
                updateNested(
                  'deliverySettings',
                  'freeDeliveryThreshold',
                  e.target.value === ''
                    ? null
                    : Number(e.target.value)
                )
              }
            />
          </div>
        </Card>

        {/* WHATSAPP */}
        <Card>
          <h2 className="font-display text-lg font-semibold text-charcoal">
            WhatsApp Settings
          </h2>

          <div className="mt-5 space-y-4">
            <Input
              label="WhatsApp number"
              placeholder="e.g. 2348012345678"
              value={form.whatsapp?.number || ''}
              onChange={(e) =>
                updateNested('whatsapp', 'number', e.target.value)
              }
            />

            <label className="flex items-center gap-3 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={form.whatsapp?.enabled ?? true}
                onChange={(e) =>
                  updateNested(
                    'whatsapp',
                    'enabled',
                    e.target.checked
                  )
                }
                className="h-4 w-4 accent-emerald"
              />
              Enable WhatsApp integration
            </label>

            <label className="flex items-center gap-3 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={
                  form.whatsapp?.orderNotifications ?? true
                }
                onChange={(e) =>
                  updateNested(
                    'whatsapp',
                    'orderNotifications',
                    e.target.checked
                  )
                }
                className="h-4 w-4 accent-emerald"
              />
              Send order notifications
            </label>

            <label className="flex items-center gap-3 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={
                  form.whatsapp?.customerEnquiries ?? true
                }
                onChange={(e) =>
                  updateNested(
                    'whatsapp',
                    'customerEnquiries',
                    e.target.checked
                  )
                }
                className="h-4 w-4 accent-emerald"
              />
              Enable customer enquiries
            </label>

            <label className="flex items-center gap-3 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={
                  form.whatsapp?.abandonedCartMessages ?? false
                }
                onChange={(e) =>
                  updateNested(
                    'whatsapp',
                    'abandonedCartMessages',
                    e.target.checked
                  )
                }
                className="h-4 w-4 accent-emerald"
              />
              Send abandoned-cart messages
            </label>
          </div>
        </Card>

        {/* STORE SETTINGS SAVE BUTTON */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>

      {/* SECURITY */}
      <Card className="mt-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Security
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Change the password used to access the admin dashboard.
          </p>
        </div>

        {/* IMPORTANT: This is now a separate form */}
        <form
          onSubmit={handlePasswordChange}
          className="space-y-4"
        >
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                currentPassword: e.target.value,
              }))
            }
            placeholder="Enter your current password"
            autoComplete="current-password"
          />

          <Input
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                newPassword: e.target.value,
              }))
            }
            placeholder="Enter your new password"
            autoComplete="new-password"
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            placeholder="Confirm your new password"
            autoComplete="new-password"
          />

          {passwordError && (
            <p className="text-sm text-red-600">
              {passwordError}
            </p>
          )}

          {passwordMessage && (
            <p className="text-sm text-emerald-600">
              {passwordMessage}
            </p>
          )}

          <Button type="submit" disabled={passwordSaving}>
            {passwordSaving
              ? 'Changing Password...'
              : 'Change Password'}
          </Button>
        </form>
      </Card>
    </div>
  );
}