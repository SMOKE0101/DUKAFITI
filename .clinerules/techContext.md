# DUKAFITI Tech Context

## Technologies Used

### Frontend Stack
- **React 18+** with TypeScript
- **Vite** for fast development and build tooling
- **Tailwind CSS** for styling with custom design system
- **shadcn/ui** components built on Radix UI primitives
- **React Router v6** for client-side routing
- **Lucide React** for icons
- **Zustand** for lightweight state management
- **React Hook Form** for form validation and management

### Backend & Infrastructure
- **Supabase** (PostgreSQL, Authentication, Storage, Edge Functions)
- **Supabase Realtime** for live updates
- **Supabase Storage** for image and file storage
- **Edge Functions** for serverless API endpoints

### Offline-First Architecture
- **IndexedDB** for local data storage
- **Service Worker** with Workbox for caching and offline support
- **Custom Sync Layer** for handling offline/online transitions
- **Background Sync** for pending operations

### Development Tools
- **TypeScript** for type safety
- **ESLint** and **Prettier** for code quality
- **Vitest** for unit testing
- **Playwright** for end-to-end testing
- **GitHub Actions** for CI/CD
- **Vercel** for deployment

### Mobile & PWA
- **Progressive Web App** with installable experience
- **Web Manifest** for PWA capabilities
- **Service Worker** for offline functionality
- **Touch-optimized UI** for mobile devices
- **Responsive Design** with mobile-first approach

## Development Setup

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm
- Supabase CLI (for local development)
- Git

### Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_PWA_ENABLED` - Enable/disable PWA features

### Project Structure
```
src/
├── components/     # React components organized by feature
├── hooks/          # Custom React hooks
├── lib/            # Utility functions and shared logic
├── pages/          # Page components for routing
├── services/       # Service layer for API calls
├── types/          # TypeScript type definitions
├── utils/          # Helper functions
└── config/         # Configuration files
```

## Technical Constraints

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Android)
- Progressive enhancement for older browsers

### Performance Requirements
- First load under 3 seconds
- Sub-100ms response for UI interactions
- Efficient caching strategies
- Code splitting for lazy loading

### Security Considerations
- HTTPS required for PWA features
- Proper authentication and authorization
- Input validation and sanitization
- Secure storage of sensitive data
- Protection against common web vulnerabilities

### Offline Capabilities
- Full functionality without internet connection
- Automatic sync when connectivity is restored
- Conflict resolution for data synchronization
- Local storage quotas and management

## Dependencies

### Core Dependencies
- `react` and `react-dom`
- `react-router-dom`
- `@supabase/supabase-js`
- `lucide-react`
- `tailwindcss`
- `@radix-ui/react-*` (via shadcn/ui)
- `zustand`
- `react-hook-form`

### Development Dependencies
- `typescript`
- `vite`
- `@vitejs/plugin-react`
- `eslint`
- `prettier`
- `@types/*` for TypeScript definitions

## Tool Usage Patterns

### Component Development
- Use shadcn/ui components as base
- Follow atomic design principles
- Implement proper TypeScript interfaces
- Use React hooks for state management
- Follow accessibility guidelines

### Data Management
- Use unified hooks for data operations
- Implement proper error handling
- Handle loading states gracefully
- Use optimistic updates where appropriate
- Implement proper caching strategies

### Testing
- Unit tests for hooks and utility functions
- Integration tests for components
- End-to-end tests for critical user flows
- Offline/online transition testing
- Performance testing for key metrics

### Deployment
- Vercel for production deployment
- GitHub Actions for CI/CD
- Environment-specific configurations
- Proper error monitoring and logging
- Performance monitoring and optimization
