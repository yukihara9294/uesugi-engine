# SQLAlchemy 2.0 Migration Notes

## Summary of Changes

All usages of the old `database` object from `app.core.database` have been replaced with SQLAlchemy 2.0's async functionality.

### Files Modified:

1. **app/services/weather_service.py**
   - Replaced `from app.core.database import database` with `from app.core.database import AsyncSessionLocal`
   - Updated `save_weather_data()` to use async session context manager
   - Added proper session commit after execute

2. **app/services/dummy_data_generator.py**
   - Replaced `from app.core.database import database` with `from app.core.database import AsyncSessionLocal`
   - Updated `_save_points_batch()` to use async session and individual executions (as execute_many is not available in SQLAlchemy 2.0)
   - Updated `_generate_landmark_data()` to use async session

3. **app/api/endpoints/statistics.py**
   - Replaced `from app.core.database import database` with `from app.core.database import AsyncSessionLocal`
   - Updated all `database.fetch_one()` and `database.fetch_all()` calls to use async session context managers
   - Added `text()` wrapper for raw SQL queries
   - Used `result.mappings().first()` for single row results and `result.mappings().all()` for multiple rows

4. **app/api/endpoints/weather.py**
   - Replaced `from app.core.database import database` with `from app.core.database import AsyncSessionLocal`
   - Updated weather history and conditions endpoints to use async sessions

5. **app/api/endpoints/health.py**
   - Replaced `database` import with `AsyncSessionLocal`
   - Updated health check database connectivity test to use async session

6. **app/api/endpoints/heatmap.py**
   - Added `AsyncSessionLocal` import (was missing `database` import but using it)
   - Updated all database queries to use async sessions

### Key Changes Pattern:

**Before:**
```python
from app.core.database import database

# Single row
result = await database.fetch_one(query, params)

# Multiple rows
rows = await database.fetch_all(query, params)

# Execute
await database.execute(query, params)
```

**After:**
```python
from app.core.database import AsyncSessionLocal
from sqlalchemy import text

# Single row
async with AsyncSessionLocal() as session:
    result = await session.execute(text(query), params)
    row = result.mappings().first()

# Multiple rows
async with AsyncSessionLocal() as session:
    result = await session.execute(text(query), params)
    rows = result.mappings().all()

# Execute with commit
async with AsyncSessionLocal() as session:
    await session.execute(text(query), params)
    await session.commit()
```

### Notes:
- All raw SQL queries are now wrapped with `text()` from SQLAlchemy
- Session commits are explicit after data modifications
- The `execute_many` functionality was replaced with loops executing individual statements
- All async sessions are properly managed with context managers