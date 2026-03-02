import type { DashboardAccount, AggregatedDashboard, MergedUnreadChat } from '../types';

/**
 * Aggregates KPIs across all accounts
 */
export function aggregateDashboard(accounts: DashboardAccount[]): AggregatedDashboard {
  if (accounts.length === 0) {
    return {
      revenue_net: 0,
      unread_chats: 0,
      unread_messages: 0,
      likes: 0,
      followers: 0,
      status: {
        online_count: 0,
        total_count: 0,
        last_activity_date: new Date().toISOString(),
      },
    };
  }

  const revenue_net = accounts.reduce((sum, acc) => sum + acc.kpis.revenue_net, 0);
  const unread_chats = accounts.reduce((sum, acc) => sum + acc.kpis.unread_chats, 0);
  const unread_messages = accounts.reduce((sum, acc) => sum + acc.kpis.unread_messages, 0);
  const likes = accounts.reduce((sum, acc) => sum + acc.kpis.likes, 0);
  const followers = accounts.reduce((sum, acc) => sum + acc.kpis.followers, 0);

  const online_count = accounts.filter((acc) => acc.kpis.status.is_online).length;
  const total_count = accounts.length;

  // Find most recent last_activity_date
  const last_activity_date = accounts
    .map((acc) => parseDateTime(acc.kpis.status.last_activity_date))
    .sort((a, b) => b.getTime() - a.getTime())[0]
    .toISOString();

  return {
    revenue_net,
    unread_chats,
    unread_messages,
    likes,
    followers,
    status: {
      online_count,
      total_count,
      last_activity_date,
    },
  };
}

/**
 * Merges all unread chats from all accounts, sorts by date, returns top 10
 */
export function mergeUnreadChats(accounts: DashboardAccount[]): MergedUnreadChat[] {
  const allChats: MergedUnreadChat[] = [];

  accounts.forEach((account) => {
    account.lists.latest_unread_chats.forEach((chat) => {
      allChats.push({
        ...chat,
        fourbased_id: chat.fourbased_id || account.profile.fourbased_id,
        account_name: account.profile.name,
        account_img_url: account.profile.img_url,
      });
    });
  });

  // Sort by last_message_at descending
  allChats.sort((a, b) => {
    const dateA = parseDateTime(a.last_message_at);
    const dateB = parseDateTime(b.last_message_at);
    return dateB.getTime() - dateA.getTime();
  });

  return allChats.slice(0, 10);
}

/**
 * Parses a date string (may be "YYYY-MM-DD HH:mm:ss" or ISO) to Date
 */
export function parseDateTime(dateStr: string): Date {
  // If it's in format "YYYY-MM-DD HH:mm:ss", convert to ISO
  if (dateStr.includes(' ') && !dateStr.includes('T')) {
    const isoStr = dateStr.replace(' ', 'T');
    return new Date(isoStr);
  }
  return new Date(dateStr);
}

/**
 * Formats a number as USD currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Formats a date string to German locale
 */
export function formatDate(dateStr: string): string {
  const date = parseDateTime(dateStr);
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a date string as relative time (e.g., "2h ago")
 */
export function formatRelativeTime(dateStr: string): string {
  const date = parseDateTime(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}
