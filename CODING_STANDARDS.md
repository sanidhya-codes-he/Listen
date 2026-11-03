# Coding standards

Applied in review. These are judgement calls; anything a tool can check belongs in ruff or CI.

1. **Spoken words stay private.** Text the owner said reaches the log only through `words()`
   (`agent/listen_agent/core/logs.py`), and exception messages say what went wrong without quoting
   it (`no command matches`), because tracebacks go to the log (spec §9.2). Python's own messages
   quote values too (`int(text)`, a `KeyError` on the sentence): convert or look up spoken text only
   where such an error is caught and re-raised without the words.
2. **Restructuring says why now.** A PR that moves, extracts or splits code states in its
   description why that belongs in this PR rather than a later one.
3. **Tests reaching into internals say why.** A test that reads or replaces a private attribute
   (`_name`) carries a one-line comment explaining why the public interface is not enough.
