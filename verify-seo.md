# SEO Verification Checklist for soundswoop.com

## Metadata Tags to Check

Look for these tags in the page source:

### Basic Meta Tags
```html
<title>VibeForge - AI Music Generator | Create Music with AI</title>
<meta name="description" content="Create personalized AI-generated music...">
<meta name="keywords" content="AI music generator, create music with AI...">
```

### Open Graph Tags
```html
<meta property="og:url" content="https://soundswoop.com">
<meta property="og:type" content="website">
<meta property="og:title" content="VibeForge - AI Music Generator">
<meta property="og:description" content="Create personalized AI-generated music...">
<meta property="og:image" content="https://soundswoop.com/og-image.png">
<meta property="og:site_name" content="VibeForge">
```

### Twitter Card Tags
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="VibeForge - AI Music Generator">
<meta name="twitter:description" content="Create personalized AI-generated music...">
<meta name="twitter:image" content="https://soundswoop.com/og-image.png">
```

### Canonical URL
```html
<link rel="canonical" href="https://soundswoop.com/">
```

### Structured Data (JSON-LD)
Look for `<script type="application/ld+json">` tags containing:
- SoftwareApplication schema
- Product schema
- FAQPage schema (on homepage with FAQ section)

## Verification Commands

Once the domain is accessible, run these commands:

```bash
# Check meta tags
curl -s https://soundswoop.com | grep -E "(og:|twitter:|canonical|description)" | head -20

# Check structured data
curl -s https://soundswoop.com | grep -A 20 "application/ld+json"

# Check sitemap
curl -s https://soundswoop.com/sitemap.xml

# Check robots.txt
curl -s https://soundswoop.com/robots.txt
```

## Online Tools

1. **Google Search Console**: https://search.google.com/search-console
   - Add property: https://soundswoop.com
   - Submit sitemap: https://soundswoop.com/sitemap.xml

2. **Google Rich Results Test**: https://search.google.com/test/rich-results
   - Test URL: https://soundswoop.com

3. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
   - Enter URL and click "Scrape Again" to refresh cache

4. **Twitter Card Validator**: https://cards-dev.twitter.com/validator

5. **PageSpeed Insights**: https://pagespeed.web.dev/
   - Look for SEO score > 90

6. **Lighthouse** (Chrome DevTools):
   - Open DevTools → Lighthouse tab
   - Run SEO audit
   - Should score 90+ with proper metadata

## What Should Pass

✅ Title tag present and optimized
✅ Meta description present
✅ Open Graph tags present
✅ Twitter Card tags present
✅ Canonical URL set to soundswoop.com
✅ Structured data (JSON-LD) present
✅ Sitemap accessible at /sitemap.xml
✅ Robots.txt accessible at /robots.txt
✅ No duplicate content warnings
✅ Mobile-friendly (responsive)
✅ Fast page load time
✅ HTTPS enabled

## Common Issues

❌ **Wrong domain in metadata** → Already fixed in code
❌ **Missing OG image** → Ensure /og-image.png exists
❌ **Cached old metadata** → Use Facebook Debugger to clear cache
❌ **Mixed content** → Ensure all URLs use HTTPS
❌ **Not indexed** → Submit sitemap to Google Search Console


