import { GetServerSideProps } from 'next';
import { locales, defaultLocale } from '@/i18n';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: number;
  'xhtml:link'?: Array<{
    '@rel': string;
    '@hreflang': string;
    '@href': string;
  }>;
}

function generateSitemap(): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const currentDate = new Date().toISOString().split('T')[0];

  // Pages publiques à inclure dans le sitemap
  const publicPages = [
    { path: '', priority: 1.0, changefreq: 'daily' },
    { path: 'login', priority: 0.8, changefreq: 'monthly' },
    { path: 'register', priority: 0.8, changefreq: 'monthly' },
    { path: 'dashboard', priority: 0.9, changefreq: 'weekly' },
    { path: 'confirm-email', priority: 0.5, changefreq: 'monthly' },
  ];

  const urls: SitemapUrl[] = [];

  // Générer les URLs pour chaque page et chaque locale
  publicPages.forEach((page) => {
    locales.forEach((locale) => {
      const path = page.path ? `/${page.path}` : '';
      const fullPath = path === '' ? `/${locale}` : `/${locale}${path}`;
      
      const url: SitemapUrl = {
        loc: `${baseUrl}${fullPath}`,
        lastmod: currentDate,
        changefreq: page.changefreq,
        priority: page.priority,
        'xhtml:link': locales.map((altLocale) => {
          const altPath = page.path ? `/${page.path}` : '';
          const altFullPath = altPath === '' ? `/${altLocale}` : `/${altLocale}${altPath}`;
          return {
            '@rel': 'alternate',
            '@hreflang': altLocale,
            '@href': `${baseUrl}${altFullPath}`,
          };
        }),
      };
      urls.push(url);
    });
  });

  // Générer le XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
${url['xhtml:link']
  ?.map(
    (link) => `    <xhtml:link rel="${link['@rel']}" hreflang="${link['@hreflang']}" href="${link['@href']}" />`
  )
  .join('\n')}
  </url>`
  )
  .join('\n')}
</urlset>`;

  return sitemap;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const sitemap = generateSitemap();

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default function Sitemap() {
  return null;
}

