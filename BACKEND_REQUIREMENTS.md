# Backend Requirements for DukaFiti

## MANDATORY: Supabase Integration

This document serves as a binding contract for all developers and AI assistants working on the DukaFiti project.

### Primary Backend Technology

**Supabase** is the ONLY approved backend and database technology for this project.

### Integration Requirements

#### 1. Database Operations
- **MUST** use Supabase PostgreSQL
- **MUST** implement Row Level Security (RLS)
- **MUST** use existing unified hooks (`useUnifiedProducts`, `useUnifiedCustomers`, etc.)
- **MUST** create migrations for schema changes

#### 2. Authentication
- **MUST** use Supabase Auth
- **MUST** use existing `useAuth` hook
- **MUST** support email/password and OAuth (Google)

#### 3. Storage
- **MUST** use Supabase Storage
- **MUST** use existing `useImageUpload` hook
- **MUST** use `product-images` bucket

#### 4. Serverless Operations
- **MUST** use Supabase Edge Functions
- **MUST** place functions in `supabase/functions/`
- **MUST** follow existing function patterns

#### 5. Real-time Features
- **MUST** use Supabase Realtime
- **MUST** implement postgres_changes subscriptions
- **MUST** follow existing real-time patterns

#### 6. Offline Support
- **MUST** maintain offline-first architecture
- **MUST** use `useCacheManager` for pending operations
- **MUST** use `useUnifiedSyncManager` for coordination

### Forbidden Technologies

The following technologies are **EXPLICITLY FORBIDDEN**:

- ❌ Firebase (any service)
- ❌ MongoDB or other NoSQL databases
- ❌ Custom authentication systems
- ❌ Alternative storage solutions (AWS S3, Cloudinary, etc.)
- ❌ Alternative serverless platforms (Vercel Functions, Netlify Functions, etc.)
- ❌ Alternative real-time solutions (Socket.io, Pusher, etc.)

### Compliance Validation

The project includes validation utilities in `src/utils/backendValidator.ts` that check for:
- Proper Supabase configuration
- Absence of forbidden technologies
- Correct usage of unified hooks

### Architecture Enforcement

1. **Code Review**: All PRs must pass backend compliance checks
2. **Automated Validation**: Development environment validates Supabase usage
3. **Documentation**: This document must be referenced for all backend decisions

### Exception Process

If you believe an alternative technology is necessary:

1. **DO NOT** implement it immediately
2. **CREATE** an issue explaining the requirement
3. **JUSTIFY** why Supabase cannot meet the need
4. **WAIT** for architectural approval

### Contact

For questions about backend architecture or Supabase integration:
- Review existing code patterns in `src/hooks/`
- Check migration examples in `supabase/migrations/`
- Refer to Edge Function examples in `supabase/functions/`

**Remember**: DukaFiti's architecture is built around Supabase. Maintaining this consistency is essential for project stability and future development.

---

**This document is binding for all development work on DukaFiti.**