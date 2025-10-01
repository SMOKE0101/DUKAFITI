# DUKAFITI System Patterns

## System Architecture

DUKAFITI follows a modern web application architecture with offline-first capabilities:

### Frontend Architecture
- **Framework**: React with TypeScript
- **State Management**: Custom hooks with React Context
- **UI Components**: shadcn/ui with Tailwind CSS
- **Routing**: React Router
- **Build Tool**: Vite
- **PWA**: Workbox for offline support

### Backend Integration
- **Backend**: Supabase (PostgreSQL, Authentication, Storage, Functions)
- **Offline-First**: Custom synchronization layer with IndexedDB
- **Data Layer**: Unified hooks for online/offline data operations
- **Real-time**: Supabase Real-time subscriptions

### Core Design Patterns

#### 1. Unified Data Hooks Pattern
Custom hooks that abstract online/offline data operations:
- `useUnifiedCustomers` - Customer management
- `useUnifiedProducts` - Product management
- `useUnifiedSales` - Sales transactions
- `useUnifiedMetrics` - Dashboard metrics

#### 2. Offline-First Synchronization
- Local data storage using IndexedDB
- Conflict resolution strategies
- Automatic sync when online
- Pending operations queue

#### 3. Tutorial System Pattern
- Step-based guided tours
- Conditional steps based on user state
- Interactive element highlighting
- Auto-triggered actions

#### 4. Component Composition
- Reusable UI components
- Mobile-responsive design patterns
- Context-aware components
- Progressive enhancement

## Key Technical Decisions

### Data Management
- **Local Storage**: IndexedDB for structured data
- **Cache Strategy**: Stale-while-revalidate with background sync
- **Conflict Resolution**: Last-write-wins with manual merge options
- **Data Validation**: TypeScript types with runtime validation

### User Interface
- **Design System**: shadcn/ui components with custom styling
- **Responsive Design**: Mobile-first approach with breakpoints
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Code splitting and lazy loading

### Offline Capabilities
- **Service Worker**: Custom Workbox configuration
- **Data Sync**: Custom sync coordinator
- **Network Detection**: Online/offline state management
- **Graceful Degradation**: Full functionality without network

### Security
- **Authentication**: Supabase Auth with custom hooks
- **Authorization**: Row-level security (RLS) in Supabase
- **Data Protection**: Client-side encryption for sensitive data
- **Input Validation**: Frontend and backend validation

## Component Relationships

### Customer Management Flow
```
CustomersPage
├── CustomersHeader
│   └── AddCustomerDropdown
├── CustomerCard
├── CustomerFormModal
├── PaymentModal
├── DeleteCustomerModal
└── CustomerHistoryModal
```

### Tutorial Integration
```
CustomersPage
└── CustomersTutorial
    ├── useCustomersTutorial (hook)
    └── CustomersTutorialOverlay (component)
```

### Data Layer Integration
```
CustomersPage
├── useUnifiedCustomers (data hook)
├── useSupabaseDebtPayments (payments)
└── useContactsImport (contacts import)
```

## Critical Implementation Paths

### 1. Tutorial System Enhancement
- Fix customer modal trigger on step 1 next click
- Ensure proper modal opening sequence
- Handle edge cases for empty customer state
- Improve step navigation reliability

### 2. Customer Management Flow
- Streamline add customer workflow
- Ensure proper modal state management
- Handle form validation and submission
- Manage customer data synchronization

### 3. Offline-First Synchronization
- Improve sync reliability
- Handle network state transitions
- Optimize data storage and retrieval
- Enhance conflict resolution
