export function LocalBusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "AutoPartsStore",
    "name": "DTM PARTS - דיטיאם פרטס",
    "alternateName": "DTM PARTS",
    "description": "פגושים, טמבונים ומגנים משומשים מייבוא לכל יצרני הרכב",
    "url": "https://dtm-parts.vercel.app",
    "telephone": "+972-52-514-4401",
    "email": "info@dtmparts.co.il",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "קצנשטיין",
      "addressLocality": "חיפה",
      "addressCountry": "IL"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 32.7940,
      "longitude": 34.9896
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
        "opens": "09:00",
        "closes": "19:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Friday"],
        "opens": "09:00",
        "closes": "13:00"
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "19",
      "bestRating": "5"
    },
    "priceRange": "₪₪",
    "paymentAccepted": "Cash, Credit Card, Bank Transfer",
    "currenciesAccepted": "ILS",
    "areaServed": {
      "@type": "Country",
      "name": "Israel"
    },
    "sameAs": [
      "https://www.facebook.com/DtmPartsLTD"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "DTM PARTS",
    "url": "https://dtm-parts.vercel.app",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://dtm-parts.vercel.app/catalog?search={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "inLanguage": "he"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
