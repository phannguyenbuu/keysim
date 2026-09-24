export type StepId = 'switches' | 'keycaps' | 'case' | 'extras' | 'review';

export interface SwitchOption {
  id: string;
  category: 'office' | 'gaming' | 'typing' | 'designer';
  categoryLabel: string;
  name: string;
  tagline: string;
  badge?: string;
  price: number;
  specs: {
    type: string;
    force: string;
    travel: string;
    soundLevel: string;
    soundFrequency: number;
    soundType: 'silent-linear' | 'speed-linear' | 'tactile-thock' | 'clicky';
  };
  description: string;
  image: string;
  color: string;
}

export interface KeycapOption {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  price: number;
  material: string;
  profile: string;
  compatibility: string;
  description: string;
  image: string;
  palette: string[];
}

export interface CaseOption {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  price: number;
  material: string;
  mountType: string;
  connectivity: string;
  weight: string;
  description: string;
  image: string;
  colorHex: string;
}

export interface ExtraOption {
  id: string;
  name: string;
  tagline: string;
  category: 'cable' | 'tuning' | 'artisan' | 'rest';
  price: number;
  description: string;
  image: string;
  iconName: string;
}

export interface BuildConfiguration {
  selectedSwitchId: string;
  selectedKeycapId: string;
  selectedCaseId: string;
  selectedExtraIds: string[];
}

export interface OrderCustomerInfo {
  fullName: string;
  email: string;
  address: string;
  city: string;
  paymentMethod: 'card' | 'apple_pay' | 'crypto';
}
