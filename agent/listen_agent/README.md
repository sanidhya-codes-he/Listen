# listen_agent/  (the agent's Python package)

`import listen_agent` loads this folder. One sub-folder per box in the architecture diagram (Doc 02, Section 5).
Every module talks to the others only through the event bus in `core/`; none imports another (except `sync/` reading `storage/`).
