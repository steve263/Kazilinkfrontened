export default function JsonLD() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "KaziShow",
    url: "https://kazishow.co.ke",
    description:
      "Kenya's #1 local service booking platform. Find verified plumbers, electricians, hotels, salons and more in Nairobi.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android, iOS",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KES",
      description: "Free to use for customers",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "2000",
      bestRating: "5",
      worstRating: "1",
    },
    provider: {
      "@type": "Organization",
      name: "KaziShow Kenya",
      url: "https://kazishow.co.ke",
      logo: "https://kazishow.co.ke/icons/icon-512x512.png",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+254795542312",
        contactType: "customer service",
        areaServed: "KE",
        availableLanguage: ["English", "Swahili"],
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Nairobi",
        addressCountry: "KE",
      },
    },
    areaServed: {
      "@type": "City",
      name: "Nairobi",
      containedInPlace: {
        "@type": "Country",
        name: "Kenya",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
