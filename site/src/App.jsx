import { useMemo, useState, useEffect, useId } from 'react';
import grammar from '../../grammars/jesun-code.tmLanguage.json';
import grammarRaw from '../../grammars/jesun-code.tmLanguage.json?raw';
import { compileGrammar, scopeNames, tokenize, keywordList, testKeyword } from './tokenize.js';

const REPO = 'https://github.com/JesunAhmadUshno/jesun-code-tmlanguage';
const MAIN = 'https://github.com/JesunAhmadUshno/jesun-code';
const blob = (p) => `${REPO}/blob/main/${p}`;
const fmt = (n) => n.toLocaleString('en-US');

// Build-time facts, all derived from the grammar file.
const compiled = compileGrammar(grammar);
const SCOPES = scopeNames(grammar);
const BN = keywordList(grammar, 'keyword.control.bangla.jesun');
const EN = keywordList(grammar, 'keyword.control.jesun');
const BYTES = new TextEncoder().encode(grammarRaw).length;
const short = (s) => s.replace(/\.jesun$/, '');
const cls = (s) => `t-${short(s).replace(/\./g, '-')}`;
const cp = (w) => [...w].length;

const files = import.meta.glob('../samples/*.jc', { query: '?raw', import: 'default', eager: true });
const SAMPLE = Object.fromEntries(Object.entries(files).map(([k, v]) => [k.split('/').pop(), v]));
const PRESETS = [['hello.jc', 'English basics'], ['functions.jc', 'Functions'], ['strings.jc', 'Strings & interpolation'], ['bangla.jc', 'Bangla'], ['digits.jc', 'Bengali digits']];

const SECTIONS = [['top', 'Overview', '◎'], ['playground', 'Playground', '✎'], ['scopes', 'Scopes', '▥'], ['keywords', 'Keywords', 'অ'], ['pipeline', 'Pipeline', '⇢'], ['limits', 'Limits', '!'], ['reproduce', 'Reproduce', '❯_']];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function MenuBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  return (
    <div className="menubar" role="banner">
      <span className="apple" aria-hidden="true">◆</span>
      <a className="app" href="#top">Jesun.Code Grammar</a>
      <a className="m" href={blob('README.md')}>README</a>
      <a className="m" href={blob('grammars/jesun-code.tmLanguage.json')}>Grammar</a>
      <a className="m" href={blob('docs/research-review.md')}>Review</a>
      <span className="spacer" />
      <span className="status"><i /> Grammar checked at build</span>
      <a href={REPO}>GitHub ↗</a>
      <span className="clock">{now.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span>
    </div>
  );
}

function Dock() {
  const [active, setActive] = useState('top');
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-45% 0px -50% 0px' });
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  return (
    <nav className="dock" aria-label="Sections">
      {SECTIONS.map(([id, label, icon]) => (
        <a key={id} href={`#${id}`} className={active === id ? 'on' : ''} aria-current={active === id ? 'true' : undefined}>
          <span className="ico" aria-hidden="true">{icon}</span><span className="lbl">{label}</span>
        </a>
      ))}
    </nav>
  );
}

function Range({ label, value, min, max, step, onChange, show }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label} <span>{show}</span></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
    </div>
  );
}

export default function App() {
  useReveal();
  const [preset, setPreset] = useState('hello.jc');
  const [text, setText] = useState(SAMPLE['hello.jc']);
  const result = useMemo(() => tokenize(compiled, text), [text]);
  const load = (f) => { setPreset(f); setText(SAMPLE[f]); };
  return (
    <div className="wrap">
      <MenuBar />
      <div className="glow" aria-hidden="true" />
      <Hero />
      <Playground text={text} setText={(t) => { setText(t); setPreset(null); }} preset={preset} load={load} result={result} />
      <Scopes counts={result.counts} lines={text.split('\n').length} />
      <Keywords />
      <Pipeline />
      <Limits load={load} />
      <Reproduce />
      <Dock />
      <footer>
        Grammar: MIT. Every number on this page is computed from <code>grammars/jesun-code.tmLanguage.json</code> at build time, or live from the text in the playground.
      </footer>
    </div>
  );
}

function Hero() {
  return (
    <header className="card hero window" id="top" data-title="jesun-code.tmLanguage.json — README">
      <div className="head">
        <p className="eyebrow">TextMate grammar · scope {grammar.scopeName}</p>
        <span className="pill good">● MIT licence</span>
      </div>
      <h1>One {Math.round(BYTES / 1024)} KB grammar lets GitHub Linguist highlight Jesun.Code in both <em>Bangla</em> and English keywords.</h1>
      <p className="sub">
        Jesun.Code is a programming language whose files can be written entirely in English or entirely in Bangla.
        This repository holds the single grammar file that tells an editor, or GitHub, which words are keywords, strings, comments and numbers in <code>.{grammar.fileTypes.join(', .')}</code> files.
        Below, the grammar’s own regular expressions run in your browser: type, and watch them colour the code.
      </p>
      <div className="actions">
        <a className="btn primary" href="#playground">Open the live highlighter</a>
        <a className="btn ghost" href={blob('grammars/jesun-code.tmLanguage.json')}>Read the grammar</a>
        <span className="hint">Check it yourself with <code>cd site && npm test</code></span>
      </div>
      <div className="tiles">
        <div className="tile"><div className="num">{grammar.patterns.length}</div><div className="cap">Top-level patterns, applied in file order</div></div>
        <div className="tile"><div className="num">{BN.length}</div><div className="cap">Bangla keywords, such as {BN.find((w) => w === 'দেখাও')} (show)</div></div>
        <div className="tile"><div className="num">{EN.length}</div><div className="cap">English keywords, such as {EN.find((w) => w === 'show')}</div></div>
        <div className="tile"><div className="num">{fmt(BYTES)}</div><div className="cap">Bytes in the whole grammar, {SCOPES.length} scope names</div></div>
      </div>
    </header>
  );
}

function Playground({ text, setText, preset, load, result }) {
  const [hover, setHover] = useState(null);
  const pick = (e) => { const s = e.target.closest('[data-scope]'); if (s) setHover({ text: s.textContent, scope: s.dataset.scope }); };
  const tokens = result.lines.reduce((n, l) => n + l.filter((t) => t.scopes.length).length, 0);
  return (
    <section id="playground" className="card window reveal" data-title="highlighter.jc — live">
      <div className="head">
        <div>
          <p className="eyebrow">Live highlighter</p>
          <h2>Type Jesun.Code and the grammar colours it as you go.</h2>
          <p className="sub">
            Each of the grammar’s regexes is compiled with <code>new RegExp(src, 'u')</code> and applied in a simplified TextMate scan: line by line, earliest match wins, ties go to pattern order, and strings open a nested scope for escapes and <code>{'{interpolation}'}</code>.
            It is not GitHub’s engine, so small differences from github.com are possible. Hover or tap a token to see its scope.
          </p>
        </div>
        <span className="pill info">{fmt(tokens)} scoped tokens</span>
      </div>
      <div className="seg presets" role="group" aria-label="Load a sample program">
        {PRESETS.map(([f, l]) => <button key={f} aria-pressed={preset === f} onClick={() => load(f)}>{l}</button>)}
      </div>
      <div className="grid2 editor">
        <div>
          <label className="lab-sm" htmlFor="src">Source (editable)</label>
          <textarea id="src" spellCheck="false" value={text} onChange={(e) => setText(e.target.value)} rows={Math.max(12, text.split('\n').length + 1)} />
        </div>
        <div>
          <span className="lab-sm">Highlighted by the grammar</span>
          <pre className="code" onMouseOver={pick} onClick={pick} onMouseLeave={() => setHover(null)} aria-label="Highlighted output">
            {result.lines.map((l, i) => (
              <div key={i} className="ln">{l.length ? l.map((t, j) => t.scopes.length
                ? <span key={j} className={t.scopes.map(cls).join(' ')} data-scope={t.scopes.join(' › ')}>{t.text}</span>
                : <span key={j}>{t.text}</span>) : '​'}</div>
            ))}
          </pre>
        </div>
      </div>
      <div className="tip" aria-live="polite">
        {hover ? <><span className="mono">{hover.text.length > 40 ? `${hover.text.slice(0, 40)}…` : hover.text}</span> → <span className="mono">{grammar.scopeName} › {hover.scope}</span></> : 'Hover or tap a coloured token to inspect its scope stack.'}
      </div>
      {preset && <p className="hint" style={{ marginTop: 4 }}>Sample: <a href={blob(`site/samples/${preset}`)}>site/samples/{preset}</a>, written for this repo in the language’s documented syntax.</p>}
    </section>
  );
}

function Scopes({ counts, lines }) {
  const rows = SCOPES.map((s) => ({ s, n: counts[s] || 0 }));
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <section id="scopes" className="card window reveal" data-title={`scopes.json — ${SCOPES.length} names`}>
      <p className="eyebrow">Scope inspector</p>
      <h2>{SCOPES.length} scope names, counted live in your text.</h2>
      <p className="sub">
        Each bar counts how many times a rule matched the {fmt(lines)} line{lines === 1 ? '' : 's'} in the playground. Strings count once per string; <code>meta.function</code> counts once per definition, and its two captures count separately.
        Scopes at zero are rules your text never triggered.
      </p>
      <div className="bars scope-bars" role="list" aria-label="Rule matches per scope for the playground text">
        {rows.map((row) => (
          <div className="bar-row" role="listitem" key={row.s}>
            <div className="lab"><span className="mono">{short(row.s)}</span><b>{row.n}</b></div>
            <div className="track"><div className="fill" style={{ width: `${(100 * row.n) / max}%`, minWidth: row.n ? 8 : 0, background: `var(--${cls(row.s)}, var(--muted))` }} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Keywords() {
  const [q, setQ] = useState('');
  const [script, setScript] = useState('all');
  const maxLen = Math.max(...[...BN, ...EN].map(cp));
  const [minLen, setMinLen] = useState(1);
  const [word, setWord] = useState('showing');
  const list = [...(script !== 'en' ? BN.map((w) => [w, 'bn']) : []), ...(script !== 'bn' ? EN.map((w) => [w, 'en']) : [])]
    .filter(([w]) => cp(w) >= minLen && w.includes(q.trim()));
  const tests = word.trim() ? [['keyword.control.jesun', 'English'], ['keyword.control.bangla.jesun', 'Bangla']].map(([n, l]) => ({ l, n, ...testKeyword(grammar, n, word.trim()) })) : [];
  return (
    <section id="keywords" className="card window reveal" data-title={`keywords — ${BN.length + EN.length} entries`}>
      <p className="eyebrow">Keyword explorer</p>
      <h2>Two hand-kept word lists, fenced by Unicode-aware boundaries.</h2>
      <p className="sub">
        Each keyword rule is one alternation, parsed from the grammar at build time. Words are ordered longest-first (the check script asserts this), and each list sits between a lookbehind and lookahead that reject any neighbouring letter, digit, combining mark or underscore. That is why <code>show</code> matches but <code>showing</code> does not.
      </p>
      <div className="controls" style={{ marginTop: 16 }}>
        <div className="field"><label htmlFor="kwq">Search</label><input id="kwq" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. যদি or re" /></div>
        <div className="field"><span className="lab-sm">Script</span>
          <div className="seg" role="group" aria-label="Filter by script">
            {[['all', 'Both'], ['bn', 'Bangla'], ['en', 'English']].map(([k, l]) => <button key={k} aria-pressed={script === k} onClick={() => setScript(k)}>{l}</button>)}
          </div>
        </div>
        <Range label="Minimum length (code points)" value={minLen} min={1} max={maxLen} step={1} onChange={setMinLen} show={minLen} />
      </div>
      <p className="hint">{list.length} of {BN.length + EN.length} shown</p>
      <div className="chips">
        {list.map(([w, s]) => <span key={s + w} className={`chip ${s}`}>{w}</span>)}
        {!list.length && <span className="hint">No keyword matches that filter.</span>}
      </div>
      <h3 style={{ marginTop: 24 }}>Does this word match?</h3>
      <div className="controls" style={{ gridTemplateColumns: 'minmax(0, 1fr)', marginTop: 8 }}>
        <div className="field"><label htmlFor="kwt">Word to test against both keyword regexes</label><input id="kwt" type="search" value={word} onChange={(e) => setWord(e.target.value)} /></div>
      </div>
      <div className="grid2">
        {tests.map((t) => (
          <div className="tile" key={t.n}>
            <div className="head" style={{ marginBottom: 6 }}><h3 className="mono">{short(t.n)}</h3><span className={`pill ${t.match ? 'good' : 'warn'}`}>{t.match ? 'Matches' : 'No match'}</span></div>
            <p className="hint" style={{ margin: 0, fontSize: 13 }}>{t.l} list: {t.why}.</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pipeline() {
  const steps = [
    ['VS Code extension', <>The grammar is written for the Jesun.Code editor extension: <code>editors/vscode/syntaxes/jesun-code.tmLanguage.json</code> in the <a href={MAIN}>main repo</a>.</>],
    ['Re-exported here', <>Copied into <code>grammars/jesun-code.tmLanguage.json</code> under MIT, and declared in this repo’s <code>package.json</code> with scope <code>{grammar.scopeName}</code>.</>],
    ['Vendored by Linguist', <>GitHub Linguist pulls a permissively licensed grammar in with <code>script/add-grammar</code>.</>],
    ['Highlighted on GitHub', <>With the grammar vendored, GitHub can recognise <code>.{grammar.fileTypes[0]}</code> files and colour them.</>],
  ];
  return (
    <section id="pipeline" className="card window reveal" data-title="linguist-pipeline.md">
      <p className="eyebrow">Why this repo exists</p>
      <h2>From an editor extension to GitHub, in four hops.</h2>
      <p className="sub">This flow restates the README. Whether Linguist has merged the grammar is outside this repo, so the page does not claim it.</p>
      <ol className="flow" aria-label="Grammar pipeline from VS Code extension to github.com">
        {steps.map(([t, d], i) => <li key={t}><span className="n">{i + 1}</span><b>{t}</b><div className="hint">{d}</div></li>)}
      </ol>
      <div className="tile" style={{ marginTop: 16 }}>
        <div className="head" style={{ marginBottom: 6 }}><h3>Same file as the extension?</h3><span className="pill warn">README claim</span></div>
        <p className="hint" style={{ margin: 0, fontSize: 13 }}>
          The README says this is the same file that ships in the extension, and that improvements land there first. A build of this repo cannot see the main repo without a network fetch, so the page shows this as the README’s claim, not a verified fact. A drift check is listed as open work in the <a href={blob('docs/research-review.md')}>research review</a>.
        </p>
      </div>
    </section>
  );
}

function Limits({ load }) {
  const items = [
    ['Mode-blind keywords', 'A file is either English or Bangla, and in Bangla mode English words are ordinary names (and the other way round). The grammar highlights both lists everywhere, so a name like show in a Bangla file is coloured as a keyword.', 'limits-bangla.jc'],
    ['Comment word ends the line', 'note or মন্তব্য outside a string turns the rest of the line into a comment, even in Bangla mode where note is an ordinary name.', 'limits-bangla.jc'],
    ['Flat interpolation', 'Interpolation is one regex, {[^{}]+}, so nested braces such as {{title}} are only partly matched.', 'limits.jc'],
    ['Narrow coverage', 'No scopes for operators, punctuation, built-in functions or ordinary identifiers; only function names in definitions get a scope.', null],
    ['Simplified scanner', 'This page runs the regexes with JavaScript, not the Oniguruma engine GitHub and VS Code use. Every regex here compiles in both, but edge cases may differ.', null],
    ['No accuracy measurement', 'There is no labelled corpus, so the page reports rule matches, not a highlighting accuracy score.', null],
  ];
  return (
    <section id="limits" className="card window reveal" data-title="known-limits.md">
      <p className="eyebrow">Limitations and threats</p>
      <h2>What the grammar gets wrong, shown on itself.</h2>
      <div className="grid2" style={{ marginTop: 16 }}>
        {items.map(([t, d, f]) => (
          <div className="tile" key={t}>
            <div className="head" style={{ marginBottom: 6 }}><h3>{t}</h3><span className="pill warn">Limit</span></div>
            <p className="hint" style={{ margin: 0, fontSize: 13 }}>{d}</p>
            {f && <button className="btn ghost sm" onClick={() => { load(f); document.getElementById('playground').scrollIntoView(); }}>Load {f} in the playground</button>}
          </div>
        ))}
      </div>
    </section>
  );
}

function Reproduce() {
  const docs = [
    ['README.md', 'README', 'Purpose and known limits'],
    ['grammars/jesun-code.tmLanguage.json', 'Grammar', `${fmt(BYTES)} bytes, ${grammar.patterns.length} patterns`],
    ['site/src/tokenize.check.mjs', 'Check script', 'Fixtures and known answers'],
    ['site/src/tokenize.js', 'Tokenizer', 'Simplified TextMate scan'],
    ['docs/research-review.md', 'Research review', 'Rigour grades and gaps'],
    ['CHANGELOG.md', 'Changelog', 'Versions and re-export steps'],
  ];
  return (
    <section id="reproduce" className="card window reveal" data-title="Terminal — npm test">
      <p className="eyebrow">Reproduce it</p>
      <h2>Two commands check every regex and rebuild this page.</h2>
      <ol className="steps" style={{ marginTop: 16 }}>
        <li><span className="n">1</span><div><b>Clone and install</b><div className="hint"><code>git clone {REPO}.git && cd jesun-code-tmlanguage/site && npm ci</code></div></div></li>
        <li><span className="n">2</span><div><b>Run the grammar check</b><div className="hint"><code>npm test</code> parses the grammar, compiles all regexes with the u flag, checks the keyword lists and runs the fixture lines and samples.</div></div></li>
        <li><span className="n">3</span><div><b>Build the dashboard</b><div className="hint"><code>npm run build</code> runs the same check first, so a broken grammar fails the build and CI.</div></div></li>
      </ol>
      <div className="docs" style={{ marginTop: 20 }}>
        {docs.map(([p, t, d]) => <a key={p} href={blob(p)}><b>{t}</b><small>{d}</small></a>)}
      </div>
    </section>
  );
}
