<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'

// The strings come from the machine; the causes and cures are written here.
const cures = {
  SYNTAX: ['BASIC could not read the line at all.', 'A missing bracket or quote, a misspelled keyword — or a variable name with a keyword buried in it, like SCORE, which contains OR.'],
  OVERFLOW: ['A number got too big to hold.', 'Anything past about 1.7 × 10³⁸. Usually a runaway multiplication, or a division that should have been the other way up.'],
  'OUT OF MEMORY': ['No room left.', 'A very long program or a big DIM — but far more often GOSUBs that never RETURN, or loops jumped out of and never finished. Both leave litter behind that adds up.'],
  "UNDEF'D STATEMENT": ['A jump to a line that does not exist.', 'GOTO or GOSUB pointing at a deleted line, or a FN called before its DEF has run.'],
  'BAD SUBSCRIPT': ['An array index outside the array.', 'Remember DIM S(4) gives you S(0) to S(4). Also what you get for a two-dimensional DIM, which this BASIC does not have.'],
  "REDIM'D ARRAY": ['The same array was DIMmed twice.', 'Usually a DIM inside a loop or in a subroutine that gets called more than once. DIM each array once, near the top.'],
  'DIVISION BY ZERO': ['Something was divided by zero.', 'Check the divisor with an IF before you divide by a variable.'],
  'ILLEGAL DIRECT': ['A statement that only works inside a program was typed at the prompt.', 'INPUT is the one you will meet. Give the line a number and RUN it.'],
  'TYPE MISMATCH': ['A string where a number belongs, or the other way round.', 'Nearly always a missing or stray $.'],
  'STRING TOO LONG': ['A string went past 255 characters.', 'Usually a loop that keeps adding to the same string.'],
  'FORMULA TOO COMPLEX': ['An expression nested deeper than BASIC can follow.', 'Break it into two lines with a variable in between.'],
  'ILLEGAL QUANTITY': ['An argument outside what the function or statement allows.', 'A negative SQR, a CHR$ over 255, a LOCATE row past 23, a HEX over 65535, a negative ON.'],
  'RETURN WITHOUT GOSUB': ['A RETURN with no GOSUB waiting.', 'Classically, a main program with no END that runs on into its own subroutines.'],
  'NEXT WITHOUT FOR': ['A NEXT with no loop open.', 'A NEXT naming the wrong variable — or the comma form, NEXT J, I, which this BASIC does not accept. Give each loop its own NEXT.'],
  'OUT OF DATA': ['READ ran off the end of the DATA.', 'A missing sentinel value, or a loop that reads once too often.'],
  'NO DEVICE': ['The card being asked for is not fitted.', 'PEEK(781) or MEM will tell you what the machine actually found at switch-on.'],
  "CAN'T CONTINUE": ['CONT has nothing to go back to.', 'Either nothing had stopped, or the program was edited after it stopped. Editing always throws the resume point away.']
}

const errors = facts.errors.basic.errors.map((e) => ({
  ...e,
  cause: (cures[e.text] ?? [])[0],
  cure: (cures[e.text] ?? [])[1]
}))
</script>

# Every error message

An error stops your program, prints a line, and gives you the prompt back.
Nothing is lost — `LIST` still shows the program, and the variables still hold
what they held.

## Reading one

```
?SYNTAX ERROR IN 60
```

- **`?`** — every error starts with one.
- **`SYNTAX ERROR`** — what went wrong.
- **`IN 60`** — which line. No line number means it happened at the prompt.

## The list

<div v-for="e in errors" :key="e.symbol" class="err">
  <h3 :id="e.text.toLowerCase().replace(/[^a-z ]/g, '').replace(/ /g, '-')"><code>{{ e.printed }}</code></h3>
  <p>{{ e.cause }}</p>
  <p class="err-cure"><strong>Usually:</strong> {{ e.cure }}</p>
</div>

## Messages that are not errors

These print and carry on. Nothing is wrong.

| | |
|---|---|
| `?REDO FROM START` | `INPUT` wanted a number and got something else. It asks again. |
| `?EXTRA IGNORED` | `INPUT` got more answers than it asked for. It keeps the first. |
| `BREAK IN 20` | You pressed <kbd>Esc</kbd>, or the program hit `STOP`. `CONT` carries on. |

## Messages from the memory card

| | |
|---|---|
| `?LOAD ERROR` | The file isn't there, or isn't readable. Check `DIR` and check which `DISK` you're on. |
| `?SAVE ERROR` | It couldn't be written. Usually a full disk. |
| `?DEL ERROR` | The file couldn't be removed. Usually it wasn't there. |

## When there's no message at all

The machine is doing exactly what you told it, and what you told it was wrong.
[When it goes wrong](/basic/debugging) is the chapter for that.

<style scoped>
.err {
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 0.25rem;
  margin-top: 1.5rem;
}
.err h3 {
  margin-top: 0.5rem;
}
.err p {
  margin: 0.4rem 0;
}
.err-cure {
  color: var(--vp-c-text-2);
  font-size: 0.95em;
}
</style>
