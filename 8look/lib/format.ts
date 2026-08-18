export function formatPrice(price?: number | null) {
  if (typeof price !== 'number' || !Number.isFinite(price)) return 'Price on request';

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatRelativeTime(value?: string | Date | null) {
  if (!value) return 'Updated unknown';

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'Updated unknown';

  const secondsAgo = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (secondsAgo < 60) return 'Updated just now';

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) return `Updated ${minutesAgo} ${minutesAgo === 1 ? 'minute' : 'minutes'} ago`;

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `Updated ${hoursAgo} ${hoursAgo === 1 ? 'hour' : 'hours'} ago`;

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 30) return `Updated ${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`;

  const monthsAgo = Math.floor(daysAgo / 30);
  if (monthsAgo < 12) return `Updated ${monthsAgo} ${monthsAgo === 1 ? 'month' : 'months'} ago`;

  const yearsAgo = Math.floor(daysAgo / 365);
  return `Updated ${yearsAgo} ${yearsAgo === 1 ? 'year' : 'years'} ago`;
}
