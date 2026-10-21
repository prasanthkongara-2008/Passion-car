export const site = {
  name: "Passion Car",
  tagline: "Driven by Trust. Powered by Passion.",
  domain: "https://www.passioncar.in",
  canonicalUrl: "https://www.passioncar.in",
  city: "Hyderabad",
  phone: "+91 88858 58380",
  phoneRaw: "918885858380",
  heroImage: "/images/hero-delivery.webp",
  reviewImages: Array.from({ length: 28 }, (_, index) =>
    `/images/reviews/review-${String(index + 1).padStart(2, "0")}.webp`,
  ),
  googleSearchUrl: "https://www.google.com/maps/search/?api=1&query=Passion%20Car%20Hyderabad",
};

export function formatIndianPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatIndianNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}
