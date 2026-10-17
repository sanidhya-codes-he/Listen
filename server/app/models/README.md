# models/  - the shapes of data (Doc 07)

SQLAlchemy classes = PostgreSQL tables (users, sessions, devices, failed_logins, commands, usage_daily,
tombstones, change_log, command_snapshots, pending_edits) and Pydantic request/response models.
Alembic migrations are generated from these.
