# Research and engineering review

Reviewed 2026-11-07 on branch `site/live-dashboard`. This repo is a
configuration artifact (one TextMate grammar), not a study, so the research
rubric is applied in its engineering form: what claim does the artifact make,
and how well is that claim tested?

Grades: A (strong), B (adequate), C (weak), D (missing).

| Criterion | Before | Now | Notes |
|---|---|---|---|
| Question / purpose | B | B | README states one purpose: a permissively licensed grammar for Linguist to vendor so `.jc` files are highlighted on GitHub. |
| Hypotheses (testable claims) | D | B | The grammar's implied claims are now written as executable fixtures in `site/src/tokenize.check.mjs`: a comment word swallows the line, a string beats a comment word inside it, `to name` scopes the function name, Bengali digits are numbers, a keyword inside an identifier is not a keyword. |
| Method | C | B | The check parses the JSON, compiles all 13 regexes with the JS `u` flag, asserts 7 patterns, 75 Bangla and 80 English keywords (no duplicates, longest first), 10 scope names, and lossless tokenization of every sample. Limit: the scanner is a simplified TextMate engine in JavaScript, not vscode-textmate with Oniguruma. |
| Baselines | D | D | No comparison against another highlighter or against the real engine. See gap 1. |
| Statistics / uncertainty | D | D | Not applicable to a deterministic grammar in the usual sense; the relevant measure, highlighting accuracy on a labelled corpus, does not exist yet. See gap 2. |
| Reproducibility | C | A | `cd site && npm ci && npm test` reproduces every check; the same check gates the Pages build in CI. Dependencies are exact-pinned. |
| Threats to validity | D | B | Listed in the README "Known limits" section and on the dashboard, with sample files (`site/samples/limits*.jc`) that show each limit live. |
| Related work | D | C | The grammar follows the TextMate grammar format used by VS Code and Linguist; no comparison with how other bilingual or non-Latin-keyword languages are highlighted. |
| Limitations | D | B | Mode-blind keywords, comment word anywhere ends the line, flat interpolation, narrow scope coverage, apostrophe opens a string, hand-kept keyword lists. |
| Engineering: tests and CI | D | B | Fixture and known-answer check plus CI on every push touching `grammars/` or `site/`. |
| Engineering: release hygiene | C | B | `CHANGELOG.md` and documented re-export steps added. No git tag yet (tagging is a push-time action for the owner). |

## Cheap gaps fixed in this pass

- Tests: `site/src/tokenize.check.mjs` (run by `npm test` and before every build).
- Sample corpus: `site/samples/*.jc`, written for this repo in the language's
  documented syntax (English, Bangla, Bengali digits, strings, functions, limits).
- CI: `.github/workflows/pages.yml` runs the check and builds the dashboard.
- Documentation: README re-export steps, grammar check and known limits; `CHANGELOG.md`.

## Remaining gaps and what each needs

1. **Engine baseline.** Run the same fixtures through `vscode-textmate` with
   `vscode-oniguruma` (two npm packages, plus the Oniguruma WASM file) and diff the
   scopes against the JavaScript scanner. Cost: one dev dependency set and a few
   seconds of CPU in CI; no data needed.
2. **Highlighting accuracy.** Needs a labelled corpus: the 29 `.jc` programs in the main
   repo's `examples/` plus the 3 Linguist samples, with expected scopes per token
   written in the `vscode-tmgrammar-test` comment format (an estimated few hundred
   assertion lines written by hand). Then report the share of tokens scoped as
   expected, per scope.
3. **Drift guard against the extension.** The README says this file is the same as
   `editors/vscode/syntaxes/jesun-code.tmLanguage.json` in the main repo. A local
   `diff` on 2026-11-07 found them byte-identical, but this repo cannot check that
   in CI without fetching the main repo. Needs a CI step that downloads that one
   file from the main repo's default branch and compares SHA-256 hashes (one network
   request per run).
4. **Keyword drift against the lexer.** Needs the language's keyword tables
   (`docs/spec-v0.5.md` section 23 and the lexer in `jesun.py`) exported as JSON in
   the main repo, so a check here can compare sets.
5. **Mode-aware highlighting.** A grammar change, not a test: split the patterns
   into an English and a Bangla repository and choose one from the file's first
   line (`use bangla` or `বাংলা`). Must land in the extension first, per the README.
