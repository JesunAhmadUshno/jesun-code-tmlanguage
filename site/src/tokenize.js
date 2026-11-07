// A simplified TextMate scanner that runs the grammar's own regexes natively (JS RegExp, 'u' flag).
// It is not vscode-textmate/oniguruma: one line at a time, earliest match wins, ties go to
// pattern order, begin/end rules can span lines, and inside a begin/end rule the end pattern
// wins a tie (vscode-textmate's default when applyEndPatternLast is unset).

const compile = (src) => new RegExp(src, 'dgu');

export function compileGrammar(grammar) {
  const rule = (p) => ({
    name: p.name,
    match: p.match && compile(p.match),
    begin: p.begin && compile(p.begin),
    end: p.end && compile(p.end),
    captures: p.captures || null,
    patterns: (p.patterns || []).map(rule),
  });
  return { scopeName: grammar.scopeName, patterns: grammar.patterns.map(rule) };
}

// Every scope name the grammar can emit, in file order (captures included).
export function scopeNames(grammar) {
  const out = [];
  const walk = (p) => {
    if (p.name && !out.includes(p.name)) out.push(p.name);
    for (const c of Object.values(p.captures || {})) if (!out.includes(c.name)) out.push(c.name);
    (p.patterns || []).forEach(walk);
  };
  grammar.patterns.forEach(walk);
  return out;
}

function firstMatch(rules, line, pos) {
  let best = null;
  for (const r of rules) {
    const re = r.match || r.begin;
    re.lastIndex = pos;
    const m = re.exec(line);
    if (m && (!best || m.index < best.m.index)) best = { r, m };
  }
  return best;
}

// Returns lines of tokens: { text, scopes: [outer..inner] }, plus a count of rule matches per scope.
export function tokenize(compiled, source) {
  const counts = {};
  const bump = (s) => { counts[s] = (counts[s] || 0) + 1; };
  const lines = [];
  let open = null; // begin/end rule still open from a previous line
  for (const line of source.split('\n')) {
    const toks = [];
    const push = (text, scopes) => {
      if (!text) return;
      const last = toks.at(-1);
      if (last && last.scopes.join() === scopes.join()) last.text += text; // merge same-scope runs
      else toks.push({ text, scopes });
    };
    let pos = 0;
    while (pos <= line.length) {
      if (open) {
        open.end.lastIndex = pos;
        const e = open.end.exec(line);
        const sub = firstMatch(open.patterns, line, pos);
        if (sub && (!e || sub.m.index < e.index) && sub.m[0].length) {
          push(line.slice(pos, sub.m.index), [open.name]);
          push(sub.m[0], [open.name, sub.r.name]);
          bump(sub.r.name);
          pos = sub.m.index + sub.m[0].length;
          continue;
        }
        if (!e) { push(line.slice(pos), [open.name]); break; }
        push(line.slice(pos, e.index + e[0].length), [open.name]);
        pos = e.index + e[0].length;
        open = null;
        continue;
      }
      const hit = firstMatch(compiled.patterns, line, pos);
      if (!hit || !hit.m[0].length) { push(line.slice(pos), []); break; }
      const { r, m } = hit;
      push(line.slice(pos, m.index), []);
      bump(r.name);
      if (r.begin) {
        push(m[0], [r.name]);
        open = r;
      } else if (r.captures) {
        let at = m.index;
        for (let g = 1; g < m.length; g++) {
          if (!m.indices[g]) continue;
          const [s, t] = m.indices[g];
          push(line.slice(at, s), [r.name]);
          const cap = r.captures[g];
          push(line.slice(s, t), cap ? [r.name, cap.name] : [r.name]);
          if (cap && t > s) bump(cap.name);
          at = t;
        }
        push(line.slice(at, m.index + m[0].length), [r.name]);
      } else {
        push(m[0], [r.name]);
      }
      pos = m.index + m[0].length;
    }
    lines.push(toks);
  }
  return { lines, counts };
}

// Splits a keyword rule's (?:a|b|c) alternation into its words, in grammar order.
export function keywordList(grammar, name) {
  const p = grammar.patterns.find((x) => x.name === name);
  const m = p.match.match(/\(\?:([^()]*)\)/u);
  return m[1].split('|');
}

// Why does (or doesn't) a word match a keyword rule? Runs the grammar regex itself.
export function testKeyword(grammar, name, word) {
  const re = new RegExp(grammar.patterns.find((x) => x.name === name).match, 'gu');
  const words = keywordList(grammar, name);
  const full = [...word.matchAll(re)].find((m) => m.index === 0 && m[0].length === word.length);
  if (full) return { match: true, why: 'whole word matches the alternation' };
  const hits = [...word.matchAll(re)].map((m) => m[0]);
  if (hits.length) return { match: false, why: `only part matches: ${hits.join(', ')} (separate words)` };
  const inside = words.filter((k) => word.includes(k)).sort((a, b) => b.length - a.length)[0];
  if (inside) return { match: false, why: `contains "${inside}", but a letter, digit, mark or _ touches it, so the Unicode word boundary blocks the match` };
  return { match: false, why: 'not in this keyword list' };
}
