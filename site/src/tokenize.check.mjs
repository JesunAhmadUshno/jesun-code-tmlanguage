// Known-answer check, run by `npm test` and before `vite build`:
// the grammar parses, every regex compiles with the 'u' flag, the keyword lists and scopes
// have the expected sizes, and fixture lines get the scopes the grammar promises.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compileGrammar, scopeNames, tokenize, keywordList, testKeyword } from './tokenize.js';

const url = new URL('../../grammars/jesun-code.tmLanguage.json', import.meta.url);
const raw = fs.readFileSync(url, 'utf8');
const g = JSON.parse(raw);

// 1. structure
assert.equal(g.scopeName, 'source.jesun');
assert.deepEqual(g.fileTypes, ['jc']);
assert.equal(g.patterns.length, 7);
assert.equal(Buffer.byteLength(raw), fs.statSync(url).size, 'byte size the site shows equals the file size');

// 2. every regex compiles natively with the u flag (Unicode properties and lookbehind)
const all = [];
const walk = (p) => { for (const k of ['match', 'begin', 'end']) if (p[k]) all.push(p[k]); (p.patterns || []).forEach(walk); };
g.patterns.forEach(walk);
for (const src of all) assert.doesNotThrow(() => new RegExp(src, 'u'), src);
assert.equal(all.length, 13);

// 3. keyword lists: sizes, no duplicates, ordered longest-first (so a short word never shadows a longer one)
const bn = keywordList(g, 'keyword.control.bangla.jesun');
const en = keywordList(g, 'keyword.control.jesun');
assert.equal(bn.length, 75);
assert.equal(en.length, 80);
for (const list of [bn, en]) {
  assert.equal(new Set(list).size, list.length, 'duplicate keyword');
  for (let i = 1; i < list.length; i++) assert.ok([...list[i - 1]].length >= [...list[i]].length, `order: ${list[i - 1]} before ${list[i]}`);
}
assert.equal(scopeNames(g).length, 10);

// 4. fixtures: line -> expected [text, innermost scope] tokens (null = no scope)
const c = compileGrammar(g);
const inner = (src) => tokenize(c, src).lines[0].map((t) => [t.text, t.scopes.at(-1) ?? null]);
const has = (src, text, scope) => assert.ok(inner(src).some(([t, s]) => t === text && s === scope), `${src}: expected ${text} as ${scope}, got ${JSON.stringify(inner(src))}`);

assert.deepEqual(inner('note show 5 "x"'), [['note show 5 "x"', 'comment.line.jesun']]); // comment swallows the line
has('show "note this"', '"note this"', 'string.quoted.double.jesun'); // a string beats a comment word inside it
assert.ok(!inner('show "note this"').some(([, s]) => s === 'comment.line.jesun'));
has('to greet with name', 'greet', 'entity.name.function.jesun'); // 'to name' at line start
has('to greet with name', 'to', 'keyword.control.jesun');
has('জন্যে টাকা_বেরকরো সহ সারি', 'টাকা_বেরকরো', 'entity.name.function.jesun');
has('মোট হয় ১২০', '১২০', 'constant.numeric.jesun'); // Bengali digits
has('পাই হয় ৩.১৪', '৩.১৪', 'constant.numeric.jesun');
has('মোট হয় ১২০', 'হয়', 'keyword.control.bangla.jesun');
assert.deepEqual(inner('showing is 1')[0], ['showing ', null]); // keyword inside an identifier
has('x is "a\\nb {n}"', '\\n', 'constant.character.escape.jesun');
has('x is "a\\nb {n}"', '{n}', 'variable.interpolation.jesun');
has("p is 'C:\\\\d'", '\\\\', 'constant.character.escape.jesun');
has('total1 is 3', 'is', 'keyword.control.jesun');
assert.deepEqual(inner('total1 is 3')[0], ['total1 ', null]); // digit inside a name

// 5. multi-line strings stay open, and tokens round-trip losslessly
const ml = tokenize(c, 'x is "one\ntwo" and 3');
assert.equal(ml.lines[1][0].scopes[0], 'string.quoted.double.jesun');
has('show 3', '3', 'constant.numeric.jesun');

// 6. membership tester explains near misses
assert.equal(testKeyword(g, 'keyword.control.jesun', 'show').match, true);
assert.match(testKeyword(g, 'keyword.control.jesun', 'showing').why, /contains "show"/);
assert.equal(testKeyword(g, 'keyword.control.bangla.jesun', 'দেখাও').match, true);

// 7. every committed sample tokenizes losslessly
const dir = new URL('../samples/', import.meta.url);
const samples = fs.readdirSync(dir).filter((f) => f.endsWith('.jc'));
assert.ok(samples.length >= 6);
for (const f of samples) {
  const src = fs.readFileSync(new URL(f, dir), 'utf8');
  const out = tokenize(c, src);
  assert.equal(out.lines.map((l) => l.map((t) => t.text).join('')).join('\n'), src, `${f} round-trip`);
}
// documented limits behave as documented
const lim = tokenize(c, fs.readFileSync(new URL('limits.jc', dir), 'utf8')).lines;
assert.ok(lim[2].some((t) => t.text === 'এর' && t.scopes.at(-1) === 'keyword.control.bangla.jesun'));
const limBn = tokenize(c, fs.readFileSync(new URL('limits-bangla.jc', dir), 'utf8')).lines;
assert.equal(limBn[4][0].scopes[0], 'comment.line.jesun');

console.log('grammar ok', { patterns: g.patterns.length, regexes: all.length, bangla: bn.length, english: en.length, scopes: scopeNames(g).length, bytes: Buffer.byteLength(raw), samples: samples.length });
