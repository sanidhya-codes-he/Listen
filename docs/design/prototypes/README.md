# Web app prototypes

Clickable browser prototypes of all seven pages of the Listen web app. They are the visual
reference for building `web/`. They are **not** the app: the data is made up and nothing talks
to the server.

## Open them

Double-click `index.html` (or any page). Use the Dock at the bottom to move between pages.
The first load takes a few seconds because the browser compiles the code on the spot (the real
app is compiled ahead of time by Vite, so it will not have this delay).

Each page has a dashed **Review** switch at the top to show its states: Data, Loading, Waking up,
Error, Empty, and Cold start (Loading, then "Waking up" after 3 s, then the data).

## Folders

| Path | What it is |
|---|---|
| `*.html` | The built pages (self-contained, open from disk) |
| `screenshots/` | Each page's normal state in light and dark |
| `src/<page>.jsx`, `src/<page>.css` | Each page's prototype code |
| `src/shared.jsx`, `src/shared.css`, `src/template.html` | Shell shared by every page: tokens, header, Dock, states |
| `src/rb/` | Components from [React Bits](https://reactbits.dev), official source, unchanged (`SOURCE.txt` gives the commit). See the React Bits repository for its licence. |
| `src/build.py` | Rebuilds the `.html` files from `src/` (`python src/build.py`) |

The design decisions behind these pages are explained in `docs/learning/08-web-app.pdf`,
section "Visual design".
