export function formatPrice(price?: number | null) {
  if (typeof price !== 'number' || !Number.isFinite(price)) return 'Price on request';

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}
