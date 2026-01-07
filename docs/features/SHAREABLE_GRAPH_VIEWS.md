# URL State Management & Shareable Graph Views

## Overview

The Daadaar platform supports **shareable graph views** through URL state management. Users can share specific views of the knowledge graph, and recipients can see the exact same state when clicking the shared link.

## Features

### 1. **URL-Based State Persistence**
The application saves the current graph view state in URL query parameters:

- `view`: The current view mode (`organizations`, `people`, or `reports`)
- `organizationId`: The selected organization ID (for people view)
- `individualId`: The selected individual ID (for reports view)

### 2. **Shareable Links**
Users can share links that preserve their exact graph state:

**Example URLs:**
```
https://daadaar.com/fa?view=organizations
https://daadaar.com/fa?view=people&organizationId=123
https://daadaar.com/fa?view=reports&individualId=456
```

### 3. **Browser History Integration**
- **Back/Forward Navigation**: Users can navigate through different graph states using browser back/forward buttons
- **Bookmarkable States**: Any graph view can be bookmarked for later access
- **Deep Linking**: External links can point directly to specific graph views

## Implementation Details

### URL Parameter Parsing (`app/[locale]/page.tsx`)

The homepage is a server component that parses URL parameters on load:

```typescript
function getInitialView(searchParams: HomePageProps['searchParams']): ViewContext {
  const view = getParamValue(searchParams?.view);

  if (view === 'people') {
    const organizationId = parseNumberParam(searchParams?.organizationId);
    if (organizationId) {
      return { mode: 'people', organizationId };
    }
  }

  if (view === 'reports') {
    const individualId = parseNumberParam(searchParams?.individualId);
    if (individualId) {
      return { mode: 'reports', individualId };
    }
  }

  return { mode: 'organizations' };
}
```

**Key Points:**
- Server component must be `async` and `await searchParams` (Next.js 14+ requirement)
- Validates and parses numeric IDs with type safety
- Falls back to organizations view if parameters are invalid

### URL Synchronization (`graph-canvas.tsx`)

The graph component automatically updates the URL when users navigate:

```typescript
useEffect(() => {
  // Skip URL sync while loading initial data
  if (loading) return;
  
  // Don't sync on first load completion (preserve initial URL)
  if (!hasInitialLoadCompleted.current) {
    hasInitialLoadCompleted.current = true;
    return;
  }

  const params = new URLSearchParams(searchParams.toString());
  params.set('view', viewContext.mode);

  if (viewContext.mode === 'people' && viewContext.organizationId) {
    params.set('organizationId', String(viewContext.organizationId));
    params.delete('individualId');
  } else if (viewContext.mode === 'reports' && viewContext.individualId) {
    params.set('individualId', String(viewContext.individualId));
    params.delete('organizationId');
  }

  const nextUrl = nextSearch ? `${pathname}?${nextSearch}` : pathname;
  router.replace(nextUrl);
}, [pathname, router, searchParams, viewContext, loading]);
```

**Key Points:**
- Uses `router.replace()` to avoid polluting browser history during navigation
- Skips initial sync to preserve URL parameters on page load
- Uses i18n-aware routing to maintain locale in URLs

### Share Functionality

#### Context Menu Share
Right-click on the graph canvas to access the share option:

```typescript
const handleShare = useCallback(async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    setCopyError(false);
    setShowCopyToast(true);
    window.setTimeout(() => setShowCopyToast(false), 2000);
  } catch (error) {
    console.error('Failed to copy link:', error);
    setCopyError(true);
    setShowCopyToast(true);
  }
}, []);
```

**Features:**
- Copies current URL to clipboard
- Shows success/error toast notifications
- Accessible via right-click context menu
- Works in both English and Farsi

#### ShareLinkButton Component
Reusable component available for other parts of the application:

```typescript
<ShareLinkButton
  variant="text"
  label="Share"
  copiedLabel="Copied!"
  toastText="Link copied to clipboard"
  showToast={true}
/>
```

## User Experience

### Sharing a Graph View

1. Navigate to desired graph state (organization/person/reports)
2. Right-click anywhere on the graph canvas
3. Click "Share" in the context menu
4. Link is copied to clipboard with confirmation toast
5. Share the URL via any communication channel

### Opening a Shared Link

1. Click on shared URL
2. Page loads with exact graph state from URL
3. Locale is preserved (fa/en)
4. Data loads automatically for the specified view

### Navigation Flow

```
Organizations View (default)
    ↓ Click organization node
People View (?view=people&organizationId=X)
    ↓ Click person node
Reports View (?view=reports&individualId=Y)
    ↓ Browser back button
People View (restored from history)
    ↓ Browser back button
Organizations View (restored from history)
```

## Error Handling

### Invalid URL Parameters
- Non-numeric IDs → Falls back to organizations view
- Missing required parameters → Falls back to organizations view
- Invalid view mode → Falls back to organizations view

### Clipboard Errors
- Browser doesn't support clipboard API → Error toast shown
- User denies clipboard permission → Error toast shown
- Network issues → Error toast shown

## Internationalization

The feature works seamlessly with both English and Farsi:

```
English: /en?view=reports&individualId=3
Farsi:   /fa?view=reports&individualId=3
```

**Translation Keys:**
- `common.share`: "Share" / "اشتراک‌گذاری"
- `common.link_copied`: "Link copied to clipboard" / "لینک در کلیپ‌بورد کپی شد"
- `common.error_generic`: Error messages

## Technical Considerations

### Server vs Client Components
- **HomePage**: Server component (parses URL params on server)
- **GraphCanvas**: Client component (handles interactivity)

### Routing
- Uses `next-intl` routing wrappers (`useRouter`, `usePathname`)
- Maintains locale prefix in all URLs
- Prevents double locale bug (/fa/fa) by using i18n-aware hooks

### Performance
- URL updates use `router.replace()` (no page reload)
- State persists across language switches
- Minimal re-renders through proper effect dependencies

## Future Enhancements

Potential improvements for this feature:

1. **URL Shortening**: Generate short URLs for easier sharing
2. **Social Media Meta Tags**: Add Open Graph tags for link previews
3. **QR Code Generation**: Generate QR codes for mobile sharing
4. **Share via Native API**: Use Web Share API when available
5. **Collaborative Sessions**: Real-time collaborative graph exploration
6. **Saved Views**: Allow users to save and name custom views
7. **Timeline State**: Persist timeline filter state in URL
8. **Node Selection**: Highlight specific nodes via URL parameters

## Troubleshooting

### Issue: URL changes but content doesn't update
**Solution**: Ensure `searchParams` is awaited in server component:
```typescript
export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = await searchParams;
  // ...
}
```

### Issue: Double locale in URL (/fa/fa)
**Solution**: Use i18n-aware `usePathname` from `@/i18n/routing`:
```typescript
import { usePathname, useRouter } from '@/i18n/routing';
// NOT from 'next/navigation'
```

### Issue: URL resets on page load
**Solution**: Skip URL sync until initial load completes:
```typescript
if (!hasInitialLoadCompleted.current) {
  hasInitialLoadCompleted.current = true;
  return;
}
```
