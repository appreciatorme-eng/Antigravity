import { Zap, Building2, Sparkles } from 'lucide-react';

export interface Plan {
  name: string;
  icon: React.ReactNode;
  price: { monthly: number | string; annual: number | string };
  description: string;
  color: string;
  features: string[];
  cta: string;
  highlight: boolean;
}

export interface FAQ {
  question: string;
  answer: string;
}

export const PLANS: Plan[] = [
  {
    name: 'Starter',
    icon: <Zap size={20} />,
    price: { monthly: 999, annual: 799 },
    description: 'Perfect for solo operators just getting started.',
    color: '#00F0FF',
    features: [
      'Up to 50 Proposals/month',
      'Magic Link Proposals',
      'WhatsApp Automation (500 msgs)',
      'Basic CRM',
      'Email Support',
    ],
    cta: 'Start Free Trial',
    highlight: false,
  },
  {
    name: 'Pro',
    icon: <Sparkles size={20} />,
    price: { monthly: 2499, annual: 1999 },
    description: 'For growing agencies that need full automation.',
    color: '#FF9933',
    features: [
      'Unlimited Proposals',
      'Magic Link Proposals',
      'WhatsApp Automation (Unlimited)',
      'Driver & Supplier Portal',
      'GST Invoicing & Payments',
      'Priority 24/7 Support',
    ],
    cta: 'Get Started Now',
    highlight: true,
  },
  {
    name: 'Enterprise',
    icon: <Building2 size={20} />,
    price: { monthly: 'Custom', annual: 'Custom' },
    description: 'Tailored solutions for large TMCs and franchises.',
    color: '#A259FF',
    features: [
      'Custom API Integrations',
      'White-label Domain',
      'Dedicated Account Manager',
      'Multi-branch Management',
      'Role-based Permissions',
      'Custom Training & Onboarding',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
];

export const PRICING_FAQS: FAQ[] = [
  {
    question: 'Is there a free trial available?',
    answer:
      'Yes! We offer a 14-day free trial on our Starter and Pro plans. No credit card is required to start exploring.',
  },
  {
    question: 'Can I import data from my current CRM?',
    answer:
      'Absolutely. Our onboarding team helps you migrate your leads, itineraries, and supplier data from Excel or other CRMs for free.',
  },
  {
    question: 'Does it support international payments?',
    answer:
      'Yes, TravelBuilt integrates with global payment gateways like Stripe and Razorpay, supporting 135+ currencies.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      "Yes, you can cancel or change your plan at any time. If you cancel, you'll still have access until the end of your billing cycle.",
  },
  {
    question: 'Do you offer API access?',
    answer:
      'API access is available on our Enterprise plan for custom integrations with your existing tech stack.',
  },
  {
    question: 'What kind of support is provided?',
    answer:
      'Starter users get email support. Pro and Enterprise users enjoy priority 24/7 WhatsApp and phone support.',
  },
];
