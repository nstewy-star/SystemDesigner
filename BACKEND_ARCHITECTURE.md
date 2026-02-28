# Backend Architecture Documentation

## Overview
This document describes the backend architecture for the Device Management System. The backend is built with a robust, layered architecture using Supabase as the database.

## Architecture Layers

### 1. Database Layer (`src/lib/db/`)
The foundation of the backend, providing direct database access with proper error handling.

#### Files:
- **client.ts**: Supabase client configuration
- **error-handler.ts**: Centralized error handling utilities
- **device-definitions.repository.ts**: CRUD operations for device definitions
- **kits.repository.ts**: CRUD operations for kits
- **projects.repository.ts**: CRUD operations for projects
- **index.ts**: Public API exports

#### Key Features:
- Type-safe database operations using generated TypeScript types
- Consistent error handling with `DbResult<T>` pattern
- Automatic mapping between database rows and domain models
- Async/await error wrapping

### 2. Service Layer (`src/lib/services/`)
Business logic and orchestration layer that sits above the database layer.

#### Files:
- **device.service.ts**: Device-related business operations
- **kit.service.ts**: Kit management and BOM generation
- **project.service.ts**: Project management and export/import
- **validation.service.ts**: Data validation and business rules
- **index.ts**: Public API exports

#### Key Features:
- Input validation before database operations
- Business logic encapsulation
- Data transformation and aggregation
- BOM (Bill of Materials) generation
- Project import/export functionality

### 3. Type System (`src/types/`)
Comprehensive TypeScript type definitions for type safety across the application.

#### Files:
- **database.types.ts**: Database schema types (generated structure)
- **domain.types.ts**: Domain model types and interfaces

#### Key Types:
- `DeviceDefinition`, `Kit`, `Project`, `DeviceSchematic`
- `Connection`, `Port`, `Wall`, `DeviceInstance`
- `ValidationResult`, `BOMItem`
- Enums: `PortType`, `DeviceCategory`, `DifficultyLevel`, `ProjectStatus`

## Database Schema

### Tables

#### 1. device_definitions
Core device catalog with specifications.
- **Primary Key**: `id` (uuid)
- **Unique**: `part_number`
- **Key Fields**: name, category, specifications, compatible_devices, ports
- **RLS**: Enabled with public access policies

#### 2. kits
Pre-configured device collections.
- **Primary Key**: `id` (uuid)
- **Key Fields**: name, description, difficulty_level, devices, connections
- **Features**: Active/inactive flag, price tracking
- **RLS**: Enabled with public access policies

#### 3. projects
Customer project designs.
- **Primary Key**: `id` (uuid)
- **Key Fields**: customer_name, site_name, status, devices, connections, walls
- **Features**: Background image support, opacity controls, metadata
- **RLS**: Enabled with public access policies

#### 4. device_schematics
Custom device visual representations.
- **Primary Key**: `id` (uuid)
- **Foreign Key**: `device_definition_id` → device_definitions(id)
- **Key Fields**: svg_data, image_url, draw_elements
- **RLS**: Enabled with public access policies

### Indexes
- Optimized for common query patterns
- Part number lookups
- Customer name searches
- Status filtering
- Date-based sorting

### Triggers
- Automatic `updated_at` timestamp updates on all tables

## Error Handling

### DatabaseError Class
Custom error class with:
- Error message
- Error code
- Detailed error information
- Hints for resolution

### DbResult Pattern
```typescript
interface DbResult<T> {
  data: T | null;
  error: DatabaseError | null;
}
```

All database and service operations return `DbResult<T>` for consistent error handling.

## Validation

### Project Validation
- Customer and site names required
- Device ID uniqueness
- Connection integrity
- Part number presence

### Kit Validation
- Name length constraints
- Valid difficulty levels
- Price validation (non-negative)
- Device presence checks

### Device Configuration Validation
- LNet capacity limits (32 devices per network)
- KBus capacity limits (64 devices total)
- Required component checks (terminators, bus controllers)
- Connection compatibility validation

## Best Practices

### 1. Always Use Services
```typescript
// Good
import { projectService } from './lib/services';
const result = await projectService.createProject(data);

// Avoid direct repository access
```

### 2. Handle Errors Properly
```typescript
const { data, error } = await projectService.getProjectById(id);
if (error) {
  console.error('Failed to load project:', error.message);
  return;
}
// Use data safely
```

### 3. Validate Before Operations
```typescript
const validation = validateProjectData(projectData);
if (!validation.valid) {
  showErrors(validation.errors);
  return;
}
```

### 4. Use Type Guards
```typescript
if (project.status === 'completed') {
  // TypeScript knows status is valid
}
```

## Future Enhancements

### Authentication
The schema is ready for user-based authentication:
1. Update RLS policies to check `auth.uid()`
2. Add user_id columns to tables
3. Implement row-level security based on ownership

### Real-time Subscriptions
Supabase supports real-time:
```typescript
supabase
  .from('projects')
  .on('UPDATE', payload => {
    // Handle real-time updates
  })
  .subscribe();
```

### Audit Logging
Add audit tables to track:
- Who made changes
- What changed
- When changes occurred

## Testing Strategy

### Unit Tests
- Service layer validation logic
- Data transformation functions
- BOM generation
- Error handling

### Integration Tests
- Database operations
- End-to-end workflows
- Data integrity constraints

### Performance Tests
- Query optimization
- Index effectiveness
- Large dataset handling

## Maintenance

### Schema Changes
1. Create new migration file in `supabase/migrations/`
2. Include detailed comments
3. Test with sample data
4. Update TypeScript types
5. Deploy migration

### Adding New Features
1. Define types in `src/types/domain.types.ts`
2. Create repository functions in `src/lib/db/`
3. Add service layer logic in `src/lib/services/`
4. Export from index files
5. Update documentation

## Support

For issues or questions:
1. Check error messages and hints
2. Review validation errors
3. Consult this documentation
4. Check Supabase logs
