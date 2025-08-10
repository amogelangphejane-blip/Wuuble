# Events Functionality Setup

This document explains how to set up the new events functionality for the community calendar.

## Database Migration

The events functionality requires a new `community_events` table. You need to apply the migration located in:
`supabase/migrations/20250120000001_create_community_events.sql`

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of the migration file
4. Execute the SQL

### Option 2: Supabase CLI (if you have local setup)
```bash
npx supabase db reset
```

## Features Added

### 1. Event Creation Form
- **Date Picker**: Users can select specific dates for events using a calendar widget
- **Time Selection**: Start and end time inputs for precise scheduling
- **Location**: Support for both physical and virtual events
- **Attendee Limits**: Optional maximum attendee restrictions
- **Rich Descriptions**: Text area for detailed event descriptions

### 2. Calendar Integration
- **Date Filtering**: Click on calendar dates to filter events
- **Visual Indicators**: Dates with events are highlighted in blue
- **Real-time Updates**: Events are fetched from the database and update automatically

### 3. Event Display
- **Dynamic Listing**: Events are displayed with proper date/time formatting
- **Virtual/Physical Indicators**: Clear distinction between virtual and physical events
- **Color-coded Borders**: Different colored borders for visual variety
- **Empty State**: Helpful message when no events are scheduled

## How to Use

1. **Creating Events**: Click the "Add Event" button to open the event creation form
2. **Setting Dates**: Use the date picker to select when the event will occur
3. **Time Specification**: Optionally set start and end times for precise scheduling
4. **Location Details**: Specify location or mark as virtual event
5. **Filtering**: Use the calendar on the right to filter events by specific dates

## Database Schema

The `community_events` table includes:
- `event_date`: DATE field for the event date
- `start_time` and `end_time`: TIME fields for scheduling
- `is_virtual`: Boolean flag for virtual/physical events
- `location`: Text field for event location
- `max_attendees`: Optional attendee limit

## Security

- Row Level Security (RLS) is enabled
- Users can only create events in communities they belong to
- Users can only edit/delete their own events
- Community admins can delete any events in their communities