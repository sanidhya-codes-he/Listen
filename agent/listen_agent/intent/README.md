# intent/  - text to command (Doc 03)

Loads command YAML from ../../../commands/, validates it against shared/recipe.schema.json, normalises text,
matches patterns (regex + typed slots + specificity), applies defaults and confidence thresholds.
Also the AI command builder (calls Claude with YOUR key from agent/.env) and the offline guided form.
Publishes: IntentMatched, IntentNotMatched, ConfirmationRequested.
