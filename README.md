# jesun-code-tmlanguage

Live dashboard: https://jesunahmadushno.github.io/jesun-code-tmlanguage/

TextMate grammar for the [Jesun.Code](https://github.com/JesunAhmadUshno/jesun-code)
programming language. Scope: `source.jesun`. License: MIT.

This repository exists for one purpose: to give
[github-linguist/linguist](https://github.com/github-linguist/linguist) a
permissively licensed grammar to vendor via `script/add-grammar`, so GitHub
recognizes `.jc` files with syntax highlighting.

The grammar is the same file that ships in the Jesun.Code VS Code extension
(`editors/vscode/syntaxes/jesun-code.tmLanguage.json` in the main repo).
Improvements land in the extension first and are re-exported here.

## Re-exporting from the extension

1. Change `editors/vscode/syntaxes/jesun-code.tmLanguage.json` in the main repo first.
2. Copy it byte for byte to `grammars/jesun-code.tmLanguage.json` here
   (`diff` the two files to confirm they match).
3. Run the grammar check (below), add a `CHANGELOG.md` entry, and bump
   `version` in `package.json`.

## Checking the grammar

```
cd site && npm ci && npm test
```

`npm test` runs `site/src/tokenize.check.mjs`: it parses the grammar, compiles
every regex with the JavaScript `u` flag, checks the keyword lists (count, no
duplicates, longest first) and runs fixture lines and the sample programs in
`site/samples/` through a simplified TextMate scanner. The same check runs
before every dashboard build in CI (`.github/workflows/pages.yml`). The
`site/` folder is not part of the grammar and Linguist does not need it.

## Known limits

- The grammar is mode-blind. A Jesun.Code file is either English or Bangla,
  and in one mode the other mode's words are ordinary names, but both keyword
  lists are highlighted everywhere.
- `note` or `মন্তব্য` outside a string turns the rest of the line into a
  comment, including in Bangla mode, where `note` is an ordinary name.
- Interpolation is one flat regex (`{[^{}]+}`), so nested braces are only
  partly matched.
- No scopes for operators, punctuation, built-in functions or ordinary
  identifiers; only function names in definitions get a scope.
- A stray apostrophe outside a string opens a single-quoted string.
- The keyword lists are maintained by hand; nothing here links them to the
  language's lexer, so drift cannot be detected from this repo.
