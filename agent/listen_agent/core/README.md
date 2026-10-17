# core/  - the shared plumbing (Doc 04)

Event bus, event definitions (dataclasses), settings loading, the supervisor that restarts crashed threads.
Every other module depends on core/; core/ depends on nothing.
