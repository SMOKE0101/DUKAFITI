# Contributing to DukaFiti

## Backend Technology Requirements

### CRITICAL: Supabase-Only Policy

This project uses **Supabase** as its exclusive backend and database solution. This is a fundamental architectural decision that MUST be respected by all contributors.

### Why Supabase?

1. **Existing Infrastructure**: Extensive integration already exists
2. **Offline-First**: Sophisticated offline capabilities built around Supabase
3. **Type Safety**: Generated TypeScript types from Supabase schema
4. **Security**: Row Level Security (RLS) policies implemented
5. **Real-time**: Live updates using Supabase Realtime
6. **Serverless**: Edge Functions for backend logic

### Contribution Guidelines

#### ✅ DO

- Use Supabase for all new backend features
- Follow existing patterns in `src/hooks/useUnified*.ts`
- Create database migrations for schema changes
- Implement RLS policies for new tables
- Use TypeScript with Supabase-generated types
- Maintain offline-first architecture
- Use Edge Functions for serverless operations

#### ❌ DON'T

- Suggest Firebase as an alternative
- Introduce MongoDB or other databases
- Create custom authentication systems
- Use alternative storage solutions
- Bypass established offline-first patterns
- Modify database schema directly (use migrations)
- Ignore RLS policies

### Development Workflow

1. **Setup**: Ensure Supabase CLI is installed and configured
2. **Database Changes**: Create migrations in `supabase/migrations/`
3. **Types**: Regenerate types with `npm run supabase:types`
4. **Testing**: Use local Supabase instance with `npm run supabase:start`
5. **Deployment**: Deploy via Supabase CLI

### Code Review Checklist

Before submitting a PR, ensure:

- [ ] All backend operations use Supabase
- [ ] No alternative database technologies introduced
- [ ] Proper RLS policies implemented for new tables
- [ ] TypeScript types are up to date
- [ ] Offline-first patterns maintained
- [ ] Database migrations included for schema changes
- [ ] Edge Functions used for serverless operations

### Architecture Compliance

Any PR that introduces non-Supabase backend technologies will be rejected. If you believe an alternative is necessary, please open an issue for architectural discussion first.

### Getting Help

- Review existing hooks in `src/hooks/`
- Check migration examples in `supabase/migrations/`
- Refer to Edge Function examples in `supabase/functions/`
- Read architecture guidelines in `docs/ARCHITECTURE.md`

Remember: DukaFiti's success depends on maintaining architectural consistency around Supabase.