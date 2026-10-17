# usage/  - which app is in front (Section 4 of the design)

Checks the foreground window every 2 s, cleans window titles into site names, writes app sessions,
rolls them up into usage_daily. Publishes: ForegroundChanged.
