# PostHog post-wizard report

The wizard has completed a deep integration of your Next.js project with PostHog analytics. The integration includes client-side event tracking via the `instrumentation-client.ts` file (recommended for Next.js 15.3+), a reverse proxy setup through Next.js rewrites to improve tracking reliability, and comprehensive event tracking across key user interactions including authentication, report submissions, voting, search, and content sharing.

## Summary of Changes

### Core Integration Files
- **`instrumentation-client.ts`** - PostHog client initialization with reverse proxy configuration
- **`next.config.mjs`** - Added rewrites for PostHog reverse proxy (`/ingest/*`)
- **`.env.local`** - Added `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` environment variables

### Event Tracking Implementation

| Event Name | Description | File Path |
|------------|-------------|-----------|
| `user_signed_up` | User completed registration successfully | `app/[locale]/signup/page.tsx` |
| `user_logged_in` | User logged in successfully | `app/[locale]/login/page.tsx` |
| `user_logged_out` | User logged out of their account | `components/layout/navbar.tsx` |
| `report_submitted` | User submitted a new report about an individual | `components/reports/submit-report-modal.tsx` |
| `report_upvoted` | User upvoted a report | `components/reports/voting-buttons.tsx` |
| `report_downvoted` | User downvoted a report | `components/reports/voting-buttons.tsx` |
| `vote_removed` | User removed their vote from a report | `components/reports/voting-buttons.tsx` |
| `person_created` | Admin/moderator created a new individual/person | `components/graph/add-person-modal.tsx` |
| `organization_created` | Admin/moderator created a new organization | `components/graph/add-organization-modal.tsx` |
| `search_performed` | User performed a search query on the graph | `components/graph/graph-search.tsx` |
| `search_result_selected` | User selected a search result to navigate to | `components/graph/graph-search.tsx` |
| `link_shared` | User shared a link by copying to clipboard | `components/ui/share-link-button.tsx` |
| `media_viewed` | User opened media attachment in the lightbox viewer | `components/reports/report-detail.tsx` |

### Additional Features
- **User Identification**: Users are identified on login and signup with their username/email
- **Error Tracking**: Exception capture enabled for login, signup, and report submission errors
- **PostHog Reset**: User session is reset on logout to ensure clean analytics separation

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/281688/dashboard/1007709) - Main dashboard with all key metrics

### Insights
- [User Signups Over Time](https://us.posthog.com/project/281688/insights/9e5bEAc2) - Daily count of new user registrations
- [Report Submission Funnel](https://us.posthog.com/project/281688/insights/5w4OMQ33) - Conversion funnel from login to report submission
- [User Engagement - Votes](https://us.posthog.com/project/281688/insights/okfx0oWR) - Daily breakdown of upvotes and downvotes on reports
- [Search Activity](https://us.posthog.com/project/281688/insights/OhtKQNvM) - Search queries and result selections over time
- [Content Sharing](https://us.posthog.com/project/281688/insights/9RusbdY7) - Link shares and media views indicating user engagement
