# The keyboard

Sixty-seven mechanical keys across the front of the board. Most of it is
exactly what you'd expect — letters type letters, <kbd>Enter</kbd> sends the
line. This chapter is the rest.

<PlaceholderImage
  label="The ACE keyboard layout"
  caption="The full key layout drawn out, with the keys that do something special picked out from the ordinary letters and numbers."
/>

## Everything is in capitals

The ACE types in upper case, full stop. There is no lower case from the
keyboard — hold <kbd>Shift</kbd> and you get the symbol on a number key, but a
letter is a capital either way. <kbd>Caps Lock</kbd> is a real key with a real
switch under it, and it does nothing at all.

This suits BASIC, which wants its keywords in capitals anyway. Text in quotes
is stored exactly as you type it, so `PRINT "HELLO"` prints `HELLO` — and
there's no way to type `Hello` at the machine itself.

::: details Lower case does exist
The character set has lower-case letters in it, and anything arriving over the
[serial port](/using/serial) can be mixed case, so a listing pasted in from a
laptop keeps whatever case it was written in. The keyboard is the limit here,
not BASIC.
:::

## Stopping things

| Key | What it does |
|---|---|
| <kbd>Esc</kbd> | Stops a running program. **This is the one to remember.** |
| <kbd>Ctrl</kbd>+<kbd>C</kbd> | The same thing, for people used to typing it |
| Reset button | Restarts the machine — see below |

<kbd>Esc</kbd> is checked between every statement while a program runs, so it
works even from inside a tight loop. What you get back is:

```
BREAK IN 30

OK
```

— the line number it happened to be on. Nothing is lost. `LIST` still shows
your program, and `CONT` starts it up again from where it stopped.

At the `OK` prompt, with nothing running, <kbd>Esc</kbd> does nothing. That's
deliberate: it means you can't accidentally break something while you're just
typing a line in.

## Editing a line

There's no full-screen editor here. To change line 30, type line 30 again — the
new version replaces the old one. To delete it, type `30` on its own and press
<kbd>Enter</kbd>.

<kbd>Backspace</kbd> rubs out the last character while you're still typing a
line, before you press <kbd>Enter</kbd>.

## The reset button

It sits just above <kbd>Esc</kbd>, in the top-left corner of the keyboard,
where you can find it without looking.

Pressing it restarts the machine — but it **doesn't** wipe memory. You get the
splash screen and the `OK` prompt back, and your program is still there:

```
LIST
10 PRINT "STILL HERE"

OK
```

Your variables survive too. This is the button for getting out of anything —
a program stuck in machine code, a wedged Monitor session, a machine that has
stopped answering.

For a genuinely clean start, **switch the power off and on again**. That clears
memory properly and BASIC comes up from scratch, banner and all.

Neither one saves anything for you. If it matters, `SAVE` it first — see
[Storage](/using/storage).

## Ctrl and the arrow keys

Holding <kbd>Ctrl</kbd> sends a control code instead of a letter:
<kbd>Ctrl</kbd>+<kbd>A</kbd> through <kbd>Ctrl</kbd>+<kbd>Z</kbd> send codes 1
to 26, and <kbd>Ctrl</kbd>+<kbd>[</kbd> sends the same code as <kbd>Esc</kbd>.
Two of them do something at the prompt today —
<kbd>Ctrl</kbd>+<kbd>C</kbd> breaks, and <kbd>Ctrl</kbd>+<kbd>H</kbd> is
backspace. The rest arrive at your program as ordinary characters, for you to
do what you like with.

The **arrow keys**, <kbd>Ins</kbd> and <kbd>Del</kbd> each send a code too.
BASIC doesn't act on them — there's no cursor movement at the `OK` prompt — but
a program reading the keyboard directly can use them, and that's how you'd
build a menu or a game that reads the arrows.

::: details What `PRINT CHR$()` can and can't do
`PRINT CHR$(13)` gives you a new line, and `CHR$(7)` rings the bell. Beyond
those, the screen ignores what it's sent: control codes it doesn't recognise
are dropped, and so is anything above character 126 — so `PRINT CHR$(219)`
puts nothing on the screen, even though there is a solid block at that position
in the character set. Reaching the upper half of the character set means going
through the Kernal's raw output routine from assembly.
:::

[The character set](/reference/character-set) shows all 256 of them, and
which ones `PRINT` will pass.

<div class="card-link">

📄 **[Keyboard Layout card](/cards/keyboard-layout.html)** — the keys as they
sit on the board, and the ones worth remembering. The
**[Keyboard Matrix card](/cards/keyboard-matrix.html)** has the grid behind
them, for anyone wiring their own.

</div>
