# app/  (the server's Python package)

Three layers, each calling only the one below (Doc 02): routes/ -> services/ -> models/.
All endpoints live under /v1/. Interactive API docs are generated at /docs.
