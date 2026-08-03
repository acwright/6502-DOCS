# Your first ten minutes

You're at the `OK` prompt (see [First power-on](/getting-started/first-boot)
if you're not there yet). Everything below is typed at that prompt, and every
line of it is a real, `RUN`-verified file in this repo — the prose can't drift
from what the machine actually does, because it *is* what the machine actually
does.

## `PRINT` and arithmetic

<<< @/../samples/basic/first-program.bas{basic}

Type each line exactly as shown, pressing <kbd>Enter</kbd> after each one —
line numbers are how BASIC knows where a line goes, not decoration. Then:

```
RUN
HELLO
PASS
```

`10 PRINT "HELLO"` prints a literal string. `20 A = 6 * 7` does the arithmetic
and stores it — BASIC variables are single letters (`A`–`Z`) or a letter
followed by `$` for strings, more on that in the BASIC guide. `30` and `40`
are the same idea as a spreadsheet formula: a condition, then what to do if
it's true.

## `LIST`, `RUN`, `NEW`

`LIST` prints the program currently in memory, exactly as you typed it —
useful after you've been editing lines out of order, or just want to see what
you've built so far:

```
LIST
10 PRINT "HELLO"
20 A = 6 * 7
30 IF A = 42 THEN PRINT "PASS"
40 IF A <> 42 THEN PRINT "FAIL"
OK
```

`RUN` executes it from the top, every time — it doesn't remember where a
previous run stopped. `NEW` clears the program and every variable, starting
completely fresh; there's no undo, so `LIST` first if you're not sure.

## The two-line loop

<<< @/../samples/basic/goto-loop.bas{basic}

This is the classic: `10` prints, `20` sends control back to `10`, forever.
`RUN` it and watch `HELLO` scroll the screen without end — this is
`GOTO`, the plainest possible control-flow statement in BASIC, and also the
easiest one to lose control of. Nothing about it is broken; it's supposed to
run forever, and the machine has no way to know you didn't mean it to.

To get your prompt back, press <kbd>Ctrl</kbd>+<kbd>C</kbd> — covered properly
in [The keyboard](/using/keyboard). Then `LIST` it to confirm it's still there,
and `NEW` when you're done with it.

<PlaceholderImage
  label="BASIC session, first ten minutes"
  caption="Scripted keystrokes through first-program.bas and goto-loop.bas, captured with `dbg screen png` once scripts/capture-screens.mjs exists (Phase 8). The transcript above is already RUN-verified; only the screenshot is pending."
/>

## Where this goes next

This chapter is deliberately small — just enough to prove the machine is
alive and doing what you type. The full language — every statement, every
function, the `-1`/`0` truth convention, arrays, strings, files, and eighteen
worked programs — is [The BASIC Guide]'s own phase of this site, not this one.

[The BASIC Guide]: https://github.com/acwright/6502-DOCS/blob/main/PLAN.md#phase-4--the-basic-guide
