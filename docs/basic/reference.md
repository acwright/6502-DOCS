---
outline: false
---

<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'

const examples = facts.basicExamples.keywords

// The token table decides what exists; the examples decide how each one is
// explained. Merged here so a keyword can never appear in one and not the other.
const all = facts.basicKeywords.keywords.map((kw) => ({
  name: kw.name,
  kind: kw.kind,
  ...examples[kw.name]
}))

const byName = [...all].sort((a, b) => a.name.localeCompare(b.name))

const id = (name) => 'kw-' + name.toLowerCase().replace('$', '-string')

// Grouped by what a reader is trying to do, because that is how you arrive at
// a reference: knowing the job, not the name.
const groups = [
  ['Writing and running', ['RUN', 'LIST', 'NEW', 'CLR', 'REM', 'END', 'STOP', 'CONT']],
  ['Values', ['LET', 'DIM', 'DEF', 'FN']],
  ['Showing things', ['PRINT', 'TAB', 'SPC', 'POS', 'HEX']],
  ['Asking', ['INPUT', 'INKEY', 'JOY']],
  ['Deciding', ['IF', 'THEN', 'ELSE', 'AND', 'OR', 'NOT']],
  ['Repeating', ['FOR', 'NEXT', 'TO', 'STEP']],
  ['Jumping', ['GOTO', 'GOSUB', 'RETURN', 'ON']],
  ['Built-in lists', ['DATA', 'READ', 'RESTORE']],
  ['Arithmetic', ['SGN', 'INT', 'ABS', 'SQR', 'RND', 'LOG', 'EXP', 'SIN', 'COS', 'TAN', 'ATN', 'MIN', 'MAX']],
  ['Text', ['LEN', 'LEFT$', 'RIGHT$', 'MID$', 'CHR$', 'ASC', 'STR$', 'VAL']],
  ['Screen and sound', ['CLS', 'LOCATE', 'COLOR', 'SOUND', 'VOL']],
  ['The memory card', ['DIR', 'LOAD', 'SAVE', 'DEL', 'DISK', 'FORMAT', 'BLOAD', 'BSAVE']],
  ['Clock and lasting memory', ['TIME', 'DATE', 'SETTIME', 'SETDATE', 'NVRAM']],
  ['The machine underneath', ['PEEK', 'POKE', 'SYS', 'BANK', 'MEM', 'FRE', 'WAIT', 'PAUSE', 'BRK']]
]

const precedence = facts.basicKeywords.operatorPrecedence
</script>

# Every keyword

All {{ all.length }} of them, alphabetically, each with an example you can type
straight in. The output printed under each one is what the machine prints.

<div class="kw-index">
  <a v-for="kw in byName" :key="kw.name" :href="'#' + id(kw.name)">{{ kw.name }}</a>
</div>

## By what it does

<table>
  <thead><tr><th>Job</th><th>Keywords</th></tr></thead>
  <tbody>
    <tr v-for="[title, names] in groups" :key="title">
      <td>{{ title }}</td>
      <td>
        <template v-for="(n, i) in names" :key="n"><a :href="'#' + id(n)"><code>{{ n }}</code></a><span v-if="i < names.length - 1">, </span></template>
      </td>
    </tr>
  </tbody>
</table>

## Operator precedence

Highest first. Anything on the same row goes left to right, and brackets beat
all of it.

<table>
  <thead><tr><th></th><th>Operators</th></tr></thead>
  <tbody>
    <tr v-for="level in precedence" :key="level.rank">
      <td>{{ level.level }}</td>
      <td><code v-for="op in level.operators" :key="op">{{ op }}</code></td>
    </tr>
  </tbody>
</table>

## The keywords

<div v-for="kw in byName" :key="kw.name" class="kw-entry">
  <h3 :id="id(kw.name)">{{ kw.name }}<a class="header-anchor" :href="'#' + id(kw.name)" aria-hidden="true"></a></h3>

  <p class="kw-syntax"><code>{{ kw.syntax }}</code></p>
  <p class="kw-summary">{{ kw.summary }}</p>

  <div class="language-basic kw-code"><pre><code>{{ kw.example.join('\n') }}</code></pre></div>

  <div v-if="kw.output" class="language- kw-code"><pre><code>{{ kw.output.join('\n') }}</code></pre></div>
  <p v-if="kw.result" class="kw-result">{{ kw.result }}</p>

  <p v-if="kw.errors" class="kw-meta">
    <strong>Errors:</strong>
    <template v-for="(e, i) in kw.errors" :key="e"><code>?{{ e }} ERROR</code><span v-if="i < kw.errors.length - 1">, </span></template>
  </p>
  <p v-if="kw.see" class="kw-meta">
    <strong>See also:</strong>
    <template v-for="(s, i) in kw.see" :key="s"><a :href="'#' + id(s)"><code>{{ s }}</code></a><span v-if="i < kw.see.length - 1">, </span></template>
  </p>
</div>

<style scoped>
.kw-index {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.5rem;
  margin: 1.5rem 0;
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
}
.kw-index a {
  padding: 0.1rem 0.4rem;
  border: 1px solid var(--vp-c-divider);
  text-decoration: none;
  color: var(--vp-c-text-2);
}
.kw-index a:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-text-1);
}
.kw-entry {
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 0.5rem;
  margin-top: 2rem;
}
.kw-entry h3 {
  margin-top: 0.5rem;
}
.kw-syntax {
  margin: 0.5rem 0;
}
.kw-syntax code {
  font-size: 0.95em;
}
.kw-summary {
  margin: 0.5rem 0 1rem;
}
.kw-result {
  color: var(--vp-c-text-2);
  font-style: italic;
}
.kw-meta {
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}
.kw-code pre {
  padding: 0.75rem 1rem;
}
</style>

<div class="card-link">

📄 **[BASIC Reference card](/cards/basic-reference.html)** — every keyword,
the operator table and every error message, on three printable pages.

</div>
