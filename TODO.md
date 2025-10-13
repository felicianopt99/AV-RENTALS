# Responsiveness Fixes TODO

## Core Layout and Heights
- [ ] Update AppLayout.tsx: Replace h-screen with min-h-screen, add min-h-0 to flex children, use CSS vars for bottom nav height
- [ ] Update layout.tsx: Ensure body uses min-h-screen consistently
- [ ] Update globals.css: Add media queries for ultra-narrow screens (<320px), ensure box-sizing globally
- [ ] Update use-mobile.tsx: Integrate useOrientation for rotation handling
- [ ] Update tailwind.config.ts: Add custom breakpoint xl: 1280px

## Navigation and UI
- [ ] Update BottomNav.tsx: Add safe-area-inset-top padding, make header non-sticky on small mobile
- [ ] Update AppHeader.tsx: Adjust sticky behavior for mobile
- [ ] Update AppSidebarNav.tsx: Auto-collapse sidebar on tablet (1024px), improve swipe gestures
- [ ] Update sidebar.tsx: Ensure proper collapse on tablet

## Pages and Components
- [ ] Update dashboard/page.tsx: Replace h-screen with min-h-screen
- [ ] Update inventory views (InventoryGridView.tsx, InventoryListView.tsx): Use responsive grids, add mobile fallbacks
- [ ] Update ClientListDisplay.tsx: Add mobile card view for <md screens, replace calc(100vh-150px)
- [ ] Update EventListDisplay.tsx: Add mobile card view, replace calc(100vh-150px)
- [ ] Update QuoteListDisplay.tsx: Add mobile card view, replace calc(100vh-150px)
- [ ] Update RentalCalendarView.tsx: Set FullCalendar height to auto or min-h-[400px], add dayMaxEvents: 3 on mobile
- [ ] Update CategoryManager.tsx: Replace calc(100vh-18rem) with responsive height
- [ ] Update all pages using h-screen: Replace with min-h-screen or flex-1

## Utilities and Testing
- [ ] Add responsive utilities in lib/utils.ts (e.g., responsiveGrid)
- [ ] Update EquipmentCard.tsx: Add responsive image handling
- [ ] Test with browser_action: Launch at localhost:3000, test on iPhone SE, Galaxy Fold, landscape modes
- [ ] Verify PWA features and offline adaptation if issues persist
