/**
 * Sitemap generator for better SEO
 */

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export const generateSitemap = async (): Promise<string> => {
  const baseUrl = 'https://pompeii.app';
  const currentDate = new Date().toISOString();

  // Static pages
  const staticUrls: SitemapUrl[] = [
    {
      loc: '/',
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 1.0
    },
    {
      loc: '/communities',
      lastmod: currentDate,
      changefreq: 'hourly',
      priority: 0.9
    },
    {
      loc: '/chat',
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.8
    },
    {
      loc: '/messages',
      lastmod: currentDate,
      changefreq: 'hourly',
      priority: 0.8
    },
    {
      loc: '/azar-livestreams',
      lastmod: currentDate,
      changefreq: 'hourly',
      priority: 0.7
    },
    {
      loc: '/auth',
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    }
  ];

  // TODO: Add dynamic URLs from database
  // - Community pages: /communities/:id
  // - User profiles: /users/:id
  // - Events: /events/:id
  // - Livestreams: /livestreams/:id

  const allUrls = [...staticUrls];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url>
    <loc>${baseUrl}${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return sitemapXml;
};

// Generate robots.txt
export const generateRobotsTxt = (): string => {
  const baseUrl = 'https://pompeii.app';
  
  return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Block admin and private areas
Disallow: /admin/
Disallow: /api/private/
Disallow: /_next/
Disallow: /static/

# Allow important pages
Allow: /communities
Allow: /chat
Allow: /messages
Allow: /auth

# Block search parameters
Disallow: /*?*utm_*
Disallow: /*?*fbclid*
Disallow: /*?*gclid*`;
};

// Meta tags generator for different pages
export const generateMetaTags = (page: {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
}) => {
  const baseUrl = 'https://pompeii.app';
  const defaultImage = `${baseUrl}/assets/og-image.jpg`;

  return {
    title: `${page.title} | Pompeii`,
    description: page.description,
    openGraph: {
      title: page.title,
      description: page.description,
      url: page.url ? `${baseUrl}${page.url}` : baseUrl,
      type: page.type || 'website',
      images: [
        {
          url: page.image || defaultImage,
          width: 1200,
          height: 630,
          alt: page.title
        }
      ],
      siteName: 'Pompeii'
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      images: [page.image || defaultImage]
    }
  };
};

// Schema.org structured data generators
export const generateCommunitySchema = (community: {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  createdAt: string;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: community.name,
    description: community.description,
    url: `https://pompeii.app/communities/${community.id}`,
    foundingDate: community.createdAt,
    memberOf: {
      '@type': 'WebSite',
      name: 'Pompeii',
      url: 'https://pompeii.app'
    },
    member: {
      '@type': 'Person',
      numberOfMembers: community.memberCount
    }
  };
};

export const generateEventSchema = (event: {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    url: `https://pompeii.app/events/${event.id}`,
    location: event.location ? {
      '@type': 'VirtualLocation',
      url: `https://pompeii.app/events/${event.id}`
    } : undefined,
    organizer: {
      '@type': 'Organization',
      name: 'Pompeii',
      url: 'https://pompeii.app'
    }
  };
};