import { Injectable, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { environment } from '@env/environment';

export interface RouteSeoData {
  title?: string;
  description?: string;
  keywords?: string;
  robots?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly defaultBaseUrl = environment.baseUrl?.replace(/\/$/, '') || 'https://prashiln79.github.io/money-manager';
  private readonly defaultTitle = 'MoneyManager - Family Expense Tracker & Budget Planner';
  private readonly defaultDescription = 'Free, privacy-focused family expense tracker and personal finance manager. Track daily expenses, plan budgets, analyze spending trends, and organize accounts offline and online.';
  private readonly defaultOgImage = `${this.defaultBaseUrl}/assets/icon/app-icon/icon-512x512.png`;

  constructor(
    private titleService: Title,
    private metaService: Meta,
    @Inject(DOCUMENT) private document: Document
  ) {}

  /**
   * Updates all SEO meta tags, title, robots, and canonical URL based on route data.
   */
  public updateSeoForRoute(seoData?: RouteSeoData, currentPath = ''): void {
    if (!seoData) {
      // Default to private/noindex if route has no explicit public SEO metadata
      this.setRobots('noindex, nofollow');
      return;
    }

    const title = seoData.title || this.defaultTitle;
    const description = seoData.description || this.defaultDescription;
    const robots = seoData.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    const canonicalPath = seoData.canonicalPath !== undefined ? seoData.canonicalPath : currentPath.replace(/^\//, '').split('?')[0];
    const canonicalUrl = canonicalPath ? `${this.defaultBaseUrl}/${canonicalPath}` : `${this.defaultBaseUrl}/`;
    const ogImage = seoData.ogImage || this.defaultOgImage;

    // 1. Page Title
    this.titleService.setTitle(title);

    // 2. Primary Meta Tags
    this.metaService.updateTag({ name: 'description', content: description });
    if (seoData.keywords) {
      this.metaService.updateTag({ name: 'keywords', content: seoData.keywords });
    }
    this.metaService.updateTag({ name: 'robots', content: robots });
    this.metaService.updateTag({ name: 'googlebot', content: robots.includes('noindex') ? 'noindex, nofollow' : 'index, follow' });

    // 3. Open Graph Tags
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:url', content: canonicalUrl });
    this.metaService.updateTag({ property: 'og:type', content: seoData.ogType || 'website' });
    this.metaService.updateTag({ property: 'og:image', content: ogImage });
    this.metaService.updateTag({ property: 'og:site_name', content: 'MoneyManager' });

    // 4. Twitter Card Tags
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: ogImage });

    // 5. Canonical Link
    this.updateCanonicalUrl(canonicalUrl);
  }

  /**
   * Sets robots directive directly (e.g. for private screens).
   */
  public setRobots(robots: string): void {
    this.metaService.updateTag({ name: 'robots', content: robots });
    this.metaService.updateTag({ name: 'googlebot', content: robots });
  }

  /**
   * Updates or creates the link[rel="canonical"] tag in head.
   */
  public updateCanonicalUrl(url: string): void {
    try {
      let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = this.document.createElement('link');
        link.setAttribute('rel', 'canonical');
        this.document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    } catch (e) {
      console.warn('Could not update canonical link:', e);
    }
  }
}
