/**
 * JSON-LD structured data components for marketing pages.
 * These are Server Components — they render <script type="application/ld+json"> tags.
 */

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  description?: string;
}

export function OrganizationSchema({
  name = "TravelBuilt",
  url = "https://travelbuilt.com",
  description = "The all-in-one operating system for modern tour operators.",
}: OrganizationSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    description,
    logo: `${url}/marketing/logo.png`,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      availableLanguage: ["English", "Hindi"],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface WebsiteSchemaProps {
  name?: string;
  url?: string;
}

export function WebsiteSchema({
  name = "TravelBuilt",
  url = "https://travelbuilt.com",
}: WebsiteSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${url}/blog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ProductSchemaProps {
  name?: string;
  description?: string;
  url?: string;
  priceCurrency?: string;
  price?: string;
  priceValidUntil?: string;
}

export function ProductSchema({
  name = "TravelBuilt Pro",
  description = "All-in-one tour operator software with unlimited proposals, WhatsApp automation, and invoicing.",
  url = "https://travelbuilt.com/pricing",
  priceCurrency = "INR",
  price = "1999",
  priceValidUntil = "2027-12-31",
}: ProductSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url,
    brand: { "@type": "Brand", name: "TravelBuilt" },
    offers: {
      "@type": "Offer",
      priceCurrency,
      price,
      priceValidUntil,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BlogPostingSchemaProps {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  coverImage?: string;
}

export function BlogPostingSchema({
  title,
  description,
  url,
  datePublished,
  dateModified,
  authorName = "TravelBuilt Team",
  coverImage,
}: BlogPostingSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    url,
    datePublished,
    dateModified: dateModified ?? datePublished,
    author: { "@type": "Person", name: authorName },
    publisher: {
      "@type": "Organization",
      name: "TravelBuilt",
      logo: {
        "@type": "ImageObject",
        url: "https://travelbuilt.com/marketing/logo.png",
      },
    },
    ...(coverImage ? { image: coverImage } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQSchema({ items }: { items: FAQItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
