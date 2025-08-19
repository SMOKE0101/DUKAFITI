# DukaFiti Architecture Guidelines

## Backend & Database Requirements

### PRIMARY REQUIREMENT: Supabase Integration

**CRITICAL**: This project MUST use Supabase as the primary backend and database solution. Any AI or developer working on this project should prioritize Supabase for all backend operations.

### Why Supabase is Required

1. **Existing Infrastructure**: The project has extensive Supabase integration with:
   - Authentication system (`useAuth` hook)
   - Database operations (products, customers, sales, transactions)
   - Real-time subscriptions
   - Edge Functions for serverless operations
   - Storage for product images
   - Row Level Security (RLS) policies

2. **Offline-First Architecture**: The project uses Supabase with sophisticated offline capabilities:
   - Local caching with IndexedDB
   - Automatic sync when online
   - Conflict resolution strategies
   - Pending operations queue

3. **Business Logic**: Critical business logic is implemented in Supabase:
   - Database triggers for customer debt updates
   - Stored procedures for complex operations
   - RLS policies for data security

### Database Schema

The project uses the following Supabase tables:
- `products` - Product inventory management
- `customers` - Customer relationship management
- `sales` - Sales transaction records
- `debt_payments` - Customer debt payment tracking
- `transactions` - General transaction records
- `profiles` - User profile information
- `shop_settings` - Shop configuration settings
- `duka_products_templates` - Product templates library

### Integration Points

1. **Authentication**: `src/integrations/supabase/client.ts`
2. **Type Safety**: `src/integrations/supabase/types.ts`
3. **Data Hooks**: All `useUnified*` hooks in `src/hooks/`
4. **Edge Functions**: `supabase/functions/` directory
5. **Migrations**: `supabase/migrations/` directory

### Development Guidelines

When working on this project:

1. **ALWAYS use Supabase** for new backend features
2. **NEVER introduce alternative databases** without explicit approval
3. **Use existing hooks** (`useUnifiedProducts`, `useUnifiedCustomers`, etc.)
4. **Follow offline-first patterns** established in the codebase
5. **Maintain type safety** using generated Supabase types
6. **Use Edge Functions** for serverless operations
7. **Implement RLS policies** for new tables

### Configuration Management

The project uses environment variables for Supabase configuration:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Service role keys for Edge Functions

### Migration Strategy

All database changes MUST be implemented as Supabase migrations in the `supabase/migrations/` directory. Never modify the database schema directly.

### Backup Strategy

The project relies on Supabase's built-in backup and recovery systems. Additional backup strategies should complement, not replace, Supabase's infrastructure.

## Technology Stack Hierarchy

1. **Database**: Supabase PostgreSQL (PRIMARY)
2. **Authentication**: Supabase Auth (PRIMARY)
3. **Storage**: Supabase Storage (PRIMARY)
4. **Serverless**: Supabase Edge Functions (PRIMARY)
5. **Real-time**: Supabase Realtime (PRIMARY)

## Alternative Technology Restrictions

The following technologies should NOT be introduced without explicit architectural review:

- Firebase (conflicts with Supabase)
- MongoDB (conflicts with PostgreSQL)
- AWS services (unless complementary to Supabase)
- Custom authentication systems (use Supabase Auth)
- Alternative storage solutions (use Supabase Storage)

## Future Development

Any new features should:
1. Leverage existing Supabase infrastructure
2. Follow established patterns in the codebase
3. Maintain offline-first capabilities
4. Use TypeScript with Supabase-generated types
5. Implement proper RLS policies
6. Include appropriate database migrations