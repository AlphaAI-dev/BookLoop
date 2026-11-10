const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(pricePaise: number): string {
  return priceFormatter.format(pricePaise / 100);
}
