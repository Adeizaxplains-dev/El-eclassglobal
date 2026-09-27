import React, { useState } from 'react';
import { Input } from '../ui/Input.jsx';
import { Textarea } from '../ui/Textarea.jsx';
import { Button } from '../ui/Button.jsx';

const NIGERIAN_STATES = [
  'Lagos', 'Abuja (FCT)', 'Kano', 'Rivers', 'Oyo', 'Kaduna', 'Ogun', 'Delta', 'Anambra', 'Enugu',
  'Edo', 'Plateau', 'Cross River', 'Imo', 'Kwara', 'Osun', 'Ondo', 'Abia', 'Akwa Ibom', 'Bauchi',
];

export function CheckoutForm({ onSubmit, submitting }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '', state: '', city: '', note: '',
  });
  const [errors, setErrors] = useState({});

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Full name is required';
    if (!form.phone.trim() || form.phone.trim().length < 7) next.phone = 'A valid phone number is required';
    if (!form.address.trim()) next.address = 'Delivery address is required';
    if (!form.state) next.state = 'Please select a state';
    if (!form.city.trim()) next.city = 'City is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" name="name" value={form.name} onChange={update('name')} error={errors.name} placeholder="e.g. Aisha Bello" />
        <Input label="Phone number" name="phone" value={form.phone} onChange={update('phone')} error={errors.phone} placeholder="e.g. 08012345678" />
      </div>

      <Input label="Email (optional)" name="email" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" />

      <Input label="Delivery address" name="address" value={form.address} onChange={update('address')} error={errors.address} placeholder="Street, house number, landmark" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="state" className="mb-1.5 block text-sm font-medium text-charcoal">State</label>
          <select
            id="state"
            value={form.state}
            onChange={update('state')}
            className="w-full rounded-xl border border-charcoal/15 bg-white px-4 py-2.5 text-sm focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald"
          >
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.state && <p className="mt-1 text-xs text-terracotta">{errors.state}</p>}
        </div>
        <Input label="City" name="city" value={form.city} onChange={update('city')} error={errors.city} placeholder="e.g. Ikeja" />
      </div>

      <Textarea label="Delivery note (optional)" name="note" rows={3} value={form.note} onChange={update('note')} placeholder="Any instructions for delivery" />

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? 'Placing your order…' : 'Place order'}
      </Button>
    </form>
  );
}
