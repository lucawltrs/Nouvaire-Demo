import type { Account } from '../../modules/accounts/types';

const usd = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

interface AccountSeedInput {
  fourbased_id: string;
  name: string;
  identifier: string;
  is_online: boolean;
  lastActivityHoursAgo: number;
  netto: number;
  followers: number;
  likes: number;
  fileStacks: number;
  fileStacksWithPrice: number;
  hasSubscription: boolean;
  assigned_to?: { team_user_id: number; role: string; user_name: string } | null;
}

const RAW: AccountSeedInput[] = [
  {
    fourbased_id: 'acc_luna_rey',
    name: 'Luna Rey',
    identifier: 'luna.rey@creators.demo',
    is_online: true,
    lastActivityHoursAgo: 0.2,
    netto: 18420.5,
    followers: 24800,
    likes: 312_400,
    fileStacks: 214,
    fileStacksWithPrice: 96,
    hasSubscription: true,
    assigned_to: { team_user_id: 2, role: 'chatter', user_name: 'Mara Keller' },
  },
  {
    fourbased_id: 'acc_mia_sinclair',
    name: 'Mia Sinclair',
    identifier: 'mia.sinclair@creators.demo',
    is_online: false,
    lastActivityHoursAgo: 3.5,
    netto: 9870.0,
    followers: 15200,
    likes: 187_900,
    fileStacks: 132,
    fileStacksWithPrice: 58,
    hasSubscription: true,
    assigned_to: { team_user_id: 3, role: 'chatter', user_name: 'Jonas Vogt' },
  },
  {
    fourbased_id: 'acc_aria_storm',
    name: 'Aria Storm',
    identifier: 'aria.storm@creators.demo',
    is_online: true,
    lastActivityHoursAgo: 0.05,
    netto: 27650.75,
    followers: 41_300,
    likes: 528_100,
    fileStacks: 301,
    fileStacksWithPrice: 140,
    hasSubscription: true,
    assigned_to: { team_user_id: 4, role: 'chatter', user_name: 'Sophie Lindt' },
  },
  {
    fourbased_id: 'acc_bella_vance',
    name: 'Bella Vance',
    identifier: 'bella.vance@creators.demo',
    is_online: false,
    lastActivityHoursAgo: 18,
    netto: 4210.2,
    followers: 6800,
    likes: 54_300,
    fileStacks: 76,
    fileStacksWithPrice: 21,
    hasSubscription: false,
    assigned_to: { team_user_id: 2, role: 'chatter', user_name: 'Mara Keller' },
  },
  {
    fourbased_id: 'acc_nora_blake',
    name: 'Nora Blake',
    identifier: 'nora.blake@creators.demo',
    is_online: true,
    lastActivityHoursAgo: 1.1,
    netto: 13980.9,
    followers: 19_650,
    likes: 241_700,
    fileStacks: 168,
    fileStacksWithPrice: 74,
    hasSubscription: true,
    assigned_to: { team_user_id: 3, role: 'chatter', user_name: 'Jonas Vogt' },
  },
  {
    fourbased_id: 'acc_ivy_chase',
    name: 'Ivy Chase',
    identifier: 'ivy.chase@creators.demo',
    is_online: false,
    lastActivityHoursAgo: 40,
    netto: 1560.0,
    followers: 3100,
    likes: 18_200,
    fileStacks: 41,
    fileStacksWithPrice: 9,
    hasSubscription: false,
    assigned_to: null,
  },
];

export const DEMO_ACCOUNTS: Account[] = RAW.map((a) => ({
  online_status_dot: a.is_online ? 'green' : 'gray',
  last_activity: a.is_online ? 'Gerade eben' : `vor ${Math.round(a.lastActivityHoursAgo)} Std.`,
  followers: a.followers,
  revenue: usd(a.netto),
  fourbased_id: a.fourbased_id,
  name: a.name,
  identifier: a.identifier,
  img_url: null,
  is_online: a.is_online,
  assigned_to: a.assigned_to ?? null,
  last_activity_date: hoursAgo(a.lastActivityHoursAgo),
  total_netto_amount: a.netto,
  follower_count: a.followers,
  likes_count: a.likes,
  file_stack_count: a.fileStacks,
  file_stack_with_price_count: a.fileStacksWithPrice,
  has_subscription_configuration: a.hasSubscription,
}));
