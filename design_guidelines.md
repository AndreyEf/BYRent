# Design Guidelines: Rental Property Management Platform

## Design Approach
**Hybrid Strategy:** Airbnb-inspired property cards and browsing experience combined with Material Design principles for dashboard and account management. This balances the need for visual appeal in property listings with functional clarity in management interfaces.

## Core Design Elements

### Typography
- **Primary Font:** Inter (Google Fonts)
- **Headings:** Font weights 600-700, sizes from text-2xl to text-4xl
- **Body Text:** Font weight 400, text-base (16px) for readability
- **Labels/Meta:** Font weight 500, text-sm for form labels and property metadata
- **Property Titles:** Font weight 600, text-xl

### Layout System
**Spacing Units:** Tailwind units of 3, 4, 6, 8, 12, 16, 20
- Component padding: p-4 to p-8
- Section spacing: py-12 to py-20
- Card spacing: gap-6 for grids, p-6 for card interiors
- Form elements: gap-4 between fields

### Component Library

**Navigation:**
- Fixed header with logo left, navigation center, user profile dropdown right
- Mobile: Hamburger menu with slide-in drawer
- Tabs for "My Rental" / "My Property" sections (border-b-2 active indicator)

**Property Cards (Airbnb-style):**
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 with gap-6
- Card structure: Image top (aspect-video), property details below
- Image: Rounded corners (rounded-xl), subtle hover scale effect
- Meta info: Address (font-semibold), Owner name, Cadastral number (text-sm)
- Status badges: Rounded-full pills for "Available", "Pending Request", "Rented"
- Action button: "Request Rental" or "View Details"

**Dashboard Layout:**
- Two-section design with prominent section switcher at top
- Empty states: Centered icon + heading + "Add Property" CTA for new users
- List view option alongside grid for property management

**Forms (Registration, Add Property, Profile):**
- Single column, max-w-md centered
- Input fields: Rounded-lg, p-3, border with focus:ring treatment
- Labels: Above inputs, font-medium, mb-2
- Required indicators: Asterisk or "Required" text
- Submit buttons: Full width, rounded-lg, py-3, font-semibold

**Request System:**
- Modal overlay for rental requests (backdrop blur)
- Request card: Property thumbnail left, details right, approve/deny actions
- Notification badges on tab switchers for pending requests

**User Profile Section:**
- Avatar/initials circle (top or left sidebar)
- Editable fields with inline edit pattern
- Display unique user ID prominently but subtly (monospace font)

### Data Display
- **Property Details:** Two-column layout (image gallery left, details right) on desktop
- **User Info Cards:** Compact design with icon + label + value rows
- **Search/Filter Bar:** Sticky top bar with search input + filter dropdowns for property browsing

### Modals & Overlays
- Property details: Full-screen modal on mobile, large centered modal on desktop
- Confirmation dialogs: Small centered modal (max-w-sm) for delete/approve actions
- Backdrop: backdrop-blur-sm with opacity-50

## Animations
**Minimal approach:**
- Hover lift on property cards (translate-y-1)
- Smooth transitions for modals (opacity + scale)
- Loading spinners for async operations only

## Images
**Property Images (Essential):**
- Property cards: 16:9 aspect ratio placeholder images showing generic apartments/houses
- Empty states: Illustrative icons (home, document, user icons from Heroicons)
- User avatars: Circle cropped or initials-based generated avatars

**No Hero Section** - This is a functional dashboard application, not a marketing site. Start directly with authentication or dashboard content.

## Accessibility
- All form inputs with proper labels and ARIA attributes
- Focus indicators on all interactive elements (ring-2 ring-offset-2)
- Semantic HTML throughout (nav, main, section, article tags)
- Color contrast minimum WCAG AA compliance
- Keyboard navigation for all modals and dropdowns

## Key Principles
1. **Trust through clarity:** Property information must be immediately scannable
2. **Action-oriented:** Clear CTAs for requesting rentals and adding properties
3. **Status transparency:** Always show current state (pending, approved, rented)
4. **Responsive-first:** Mobile experience is critical for on-the-go property management