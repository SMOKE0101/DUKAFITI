# AI Development Guidelines for DukaFiti

## CRITICAL: Supabase-First Development

### For Any AI Working on This Project

**MANDATORY**: This project uses Supabase as its backend and database. You MUST:

1. **Always use Supabase** for any backend operations
2. **Never suggest alternatives** like Firebase, MongoDB, or custom backends
3. **Follow existing patterns** established in the codebase
4. **Maintain offline-first architecture** using the established sync patterns

### Quick Reference: Supabase Integration Points

#### Authentication
```typescript
// Use existing auth hook
import { useAuth } from '@/hooks/useAuth';

// In components
const { user, signIn, signUp, signOut } = useAuth();
```

#### Database Operations
```typescript
// Use unified hooks for data operations
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts';
import { useUnifiedCustomers } from '@/hooks/useUnifiedCustomers';
import { useUnifiedSales } from '@/hooks/useUnifiedSales';

// These hooks handle offline/online sync automatically
```

#### Direct Supabase Client
```typescript
// When direct client access is needed
import { supabase } from '@/integrations/supabase/client';

// Always check authentication and use RLS
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', user.id);
```

### Database Schema Reference

The project uses these Supabase tables:
- `products` - Product inventory (with variant support)
- `customers` - Customer management
- `sales` - Sales transactions
- `debt_payments` - Debt payment tracking
- `transactions` - General transactions
- `profiles` - User profiles
- `shop_settings` - Configuration
- `duka_products_templates` - Product templates

### Edge Functions

For serverless operations, use Supabase Edge Functions:
- Located in `supabase/functions/`
- Examples: `download-template-images`, `secure-daraja`

### Storage

For file uploads, use Supabase Storage:
- Bucket: `product-images`
- Use `useImageUpload` hook for uploads

### Real-time Features

For real-time updates, use Supabase Realtime:
```typescript
const channel = supabase
  .channel('table-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'table_name' }, (payload) => {
    // Handle real-time updates
  })
  .subscribe();
```

### Migration Guidelines

1. **Always create migrations** for schema changes
2. **Use descriptive filenames** without number prefixes
3. **Include markdown summaries** in migration files
4. **Enable RLS** for new tables
5. **Add appropriate policies** for data access

### Offline-First Patterns

The project implements sophisticated offline capabilities:
- Use `useCacheManager` for pending operations
- Use `useUnifiedSyncManager` for coordinated sync
- Follow established patterns in unified hooks

### DO NOT

1. ❌ Suggest Firebase as an alternative
2. ❌ Recommend MongoDB or other databases
3. ❌ Create custom authentication systems
4. ❌ Use alternative storage solutions
5. ❌ Bypass the established offline-first patterns
6. ❌ Modify database schema directly (use migrations)
7. ❌ Ignore RLS policies for new tables

### DO

1. ✅ Use Supabase for all backend operations
2. ✅ Follow existing hook patterns
3. ✅ Maintain offline-first architecture
4. ✅ Use TypeScript with Supabase types
5. ✅ Create proper migrations for schema changes
6. ✅ Implement RLS policies for security
7. ✅ Use Edge Functions for serverless needs

### Example: Adding a New Feature

When adding a new feature that needs backend support:

1. **Database**: Create Supabase migration
2. **Types**: Update types from schema
3. **Hook**: Create unified hook following existing patterns
4. **Component**: Use the hook in React components
5. **Offline**: Ensure offline support via cache manager
6. **Security**: Implement RLS policies

### Support Resources

- Supabase client: `src/integrations/supabase/client.ts`
- Type definitions: `src/integrations/supabase/types.ts`
- Existing hooks: `src/hooks/useUnified*.ts`
- Migration examples: `supabase/migrations/`
- Edge Function examples: `supabase/functions/`

Remember: This project's architecture is built around Supabase. Maintaining this consistency is crucial for the project's stability and future development.