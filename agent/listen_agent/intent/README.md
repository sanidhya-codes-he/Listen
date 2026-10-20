# intent/  - text to command (Doc 03)

Loads command YAML from ../../../commands/, validates it against shared/recipe.schema.json, normalises text,
matches patterns (regex + typed slots + specificity), applies defaults and confidence thresholds.
Also the AI command builder (calls Google Gemini with YOUR key, GEMINI_API_KEY in agent/.env) and the offline guided form.
Publishes: IntentMatched, IntentNotMatched, ConfirmationRequested.
