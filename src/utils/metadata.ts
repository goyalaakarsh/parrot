export interface LinkMetadata {
  title?: string;
  faviconUrl?: string;
}

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  try {
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const domain = new URL(normalizedUrl).hostname;
    const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    // Try background fetch with short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const response = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'text/html' },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // Extract title
        let extractedTitle = doc.querySelector('title')?.textContent?.trim();
        if (!extractedTitle) {
          extractedTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim();
        }
        if (!extractedTitle) {
          extractedTitle = doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content')?.trim();
        }

        // Clean up title (remove excess whitespace or line breaks)
        if (extractedTitle) {
          extractedTitle = extractedTitle.replace(/\s+/g, ' ');
        }

        // Extract favicon
        let extractedFavicon: string | undefined;
        const iconEl = doc.querySelector('link[rel~="icon"], link[rel="shortcut icon"]');
        if (iconEl) {
          const href = iconEl.getAttribute('href');
          if (href) {
            try {
              extractedFavicon = new URL(href, normalizedUrl).href;
            } catch {
              // Ignore invalid href resolution
            }
          }
        }

        return {
          title: extractedTitle || domain,
          faviconUrl: extractedFavicon || googleFavicon,
        };
      }
    } catch {
      // Fetch aborted, offline, or CORS error
    }

    // Offline / Fallback response
    return {
      title: domain,
      faviconUrl: googleFavicon,
    };
  } catch {
    return {};
  }
}
