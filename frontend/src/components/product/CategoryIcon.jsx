import React from 'react';
import {
  Smartphone,
  Laptop,
  Headphones,
  BatteryCharging,
  Sun,
  Watch,
  Gamepad2,
  Cable,
  Zap,
  Package,
} from 'lucide-react';

const ICON_MAP = {
  smartphone: Smartphone,
  laptop: Laptop,
  headphones: Headphones,
  battery: BatteryCharging,
  sun: Sun,
  watch: Watch,
  gamepad: Gamepad2,
  cable: Cable,
  zap: Zap,
  package: Package,
};

export function CategoryIcon({ icon, className = 'h-6 w-6' }) {
  const Icon = ICON_MAP[icon] || Package;
  return <Icon className={className} strokeWidth={1.6} />;
}
