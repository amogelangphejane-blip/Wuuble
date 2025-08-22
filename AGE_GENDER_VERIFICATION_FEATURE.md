# Age and Gender Verification Feature

## Overview
Added age and gender verification to the user sign-up process to ensure compliance with age restrictions and collect demographic information.

## Changes Made

### 1. Database Schema Updates
- **File**: `supabase/migrations/20250115000000_add_age_gender_to_profiles.sql`
- Added `age` column (INTEGER) with constraints: age >= 13 AND age <= 120
- Added `gender` column (TEXT) with options: 'male', 'female', 'non-binary', 'prefer-not-to-say'
- Updated `handle_new_user()` function to store age and gender from user metadata

### 2. Frontend Form Updates
- **File**: `src/pages/Auth.tsx`
- Added age input field with validation (minimum 13 years old)
- Added gender selection dropdown with 4 options
- Added real-time age validation with error messages
- Added terms confirmation text about age requirement
- Disabled submit button when validation fails

### 3. Authentication Hook Updates
- **File**: `src/hooks/useAuth.tsx`
- Extended `signUp` function signature to accept age and gender parameters
- Updated user metadata to include age and gender information
- Maintained backward compatibility with optional parameters

## Features

### Age Verification
- **Minimum Age**: 13 years old (COPPA compliance)
- **Maximum Age**: 120 years old (reasonable upper limit)
- **Real-time Validation**: Shows error messages immediately
- **Form Blocking**: Prevents submission with invalid ages

### Gender Selection
- **Options**: Male, Female, Non-binary, Prefer not to say
- **Required Field**: Must be selected to proceed with sign-up
- **Inclusive**: Provides non-binary and privacy options

### User Experience
- Clean, accessible form design using shadcn/ui components
- Clear error messages for age validation
- Disabled submit button prevents invalid submissions
- Terms confirmation about age requirements

## Database Constraints
- Age must be between 13 and 120 years
- Gender must be one of the predefined values
- Both fields are stored in the user's profile upon registration

## Migration Instructions
To apply the database changes:
```bash
npx supabase migration up
```

## Technical Implementation
- Uses React state management for form data
- Implements client-side validation with server-side constraints
- Leverages Supabase auth metadata for seamless data flow
- Maintains existing authentication flow while adding new fields

## Compliance
- **COPPA Compliance**: Enforces 13+ age requirement
- **Privacy Friendly**: Includes "prefer not to say" option
- **Inclusive**: Supports non-binary gender identity
- **Transparent**: Clear terms about age requirements during sign-up