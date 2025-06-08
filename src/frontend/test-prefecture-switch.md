# Prefecture Switching Test Plan

## Changes Made

1. **Added `cleanupAllLayers()` function** that:
   - Stops all animations
   - Removes all registered layers
   - Removes all sources
   - Clears registries and resets state

2. **Added source existence checks** in all initialization functions:
   - Check if source exists before adding
   - If exists, update data instead of adding new source

3. **Added `safeAddLayer()` helper function** that:
   - Checks if layer exists before adding
   - Logs success/failure for debugging

4. **Updated `initializeAllLayers()` to**:
   - Call `cleanupAllLayers()` first
   - Ensure proper state management

5. **Fixed race conditions** by:
   - Removing duplicate state updates
   - Ensuring single source of truth for initialization

## Test Steps

1. Start the application
2. Navigate to different prefectures:
   - Tokyo (139.6917, 35.6895)
   - Osaka (135.5023, 34.6937)
   - Fukuoka (130.4017, 33.5904)
   - Hiroshima (132.4594, 34.3853)

3. For each navigation:
   - Check console for errors
   - Verify no "source already exists" errors
   - Confirm layers are properly displayed
   - Test layer toggling works correctly

## Expected Behavior

- Clean prefecture switching without errors
- All layers properly cleaned up and recreated
- No duplicate source/layer errors
- Smooth transitions between prefectures