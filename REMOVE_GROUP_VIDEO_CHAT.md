# Group Video Chat Feature Removal

To completely remove the group video chat feature, delete the following files:

## Core Component Files (DELETE THESE)
1. `src/hooks/useGroupVideoChat.tsx`
2. `src/components/GroupVideoChat.tsx`
3. `src/services/groupWebRTCService.ts`
4. `src/services/groupSignalingService.ts`

## Page Components (DELETE THESE)
5. `src/pages/CommunityGroupCall.tsx`
6. `src/pages/TestGroupCall.tsx`

## Database Migration (DELETE THIS)
7. `supabase/migrations/20250812235800_add_group_video_calls.sql`

## Documentation Files (DELETE THESE)
- `GROUP_VIDEO_CALL_IMPLEMENTATION.md`
- `GROUP_VIDEO_AUDIO_FIXES_SUMMARY.md`
- `GROUP_VIDEO_CALL_FIX_SUMMARY.md`
- `APPLY_GROUP_VIDEO_CALL_FIX.md`
- `GROUP_VIDEO_CALL_FIX.md`
- `GROUP_VIDEO_CALL_TROUBLESHOOTING_REPORT.md`
- `final-group-video-fix-test.html`
- `debug-group-video-participants.html`
- `test-group-video-fix.html`
- All other HTML test files related to group video chat

## Files Already Updated
✅ `src/components/WhatsAppVideoCall.tsx` - Removed group video chat imports
✅ `src/pages/CommunityVideoChat.tsx` - Changed to use regular VideoChat component

## Additional Cleanup Required

### 1. Remove database tables (if needed)
If you want to remove the database tables, run in your Supabase SQL Editor:
```sql
DROP TABLE IF EXISTS community_group_call_participants;
DROP TABLE IF EXISTS community_group_calls;
```

### 2. Remove routes
Remove any routes that reference group video chat pages from your routing configuration.

### 3. Remove UI references
Remove any buttons, links, or UI elements that reference:
- "Start Group Call"
- "Join Group Call"  
- Group video chat features in community pages

### 4. Search and remove remaining references
Search your codebase for any remaining references to:
- `GroupVideoChat`
- `useGroupVideoChat`
- `groupWebRTCService`
- `groupSignalingService`
- `community_group_calls`
- `community_group_call_participants`

## Manual File Removal Commands (PowerShell)
```powershell
Remove-Item "src/hooks/useGroupVideoChat.tsx" -Force
Remove-Item "src/components/GroupVideoChat.tsx" -Force
Remove-Item "src/services/groupWebRTCService.ts" -Force
Remove-Item "src/services/groupSignalingService.ts" -Force
Remove-Item "src/pages/CommunityGroupCall.tsx" -Force
Remove-Item "src/pages/TestGroupCall.tsx" -Force
Remove-Item "supabase/migrations/20250812235800_add_group_video_calls.sql" -Force
```

After removing these files, your application will only have the regular 1-on-1 video chat feature available.
