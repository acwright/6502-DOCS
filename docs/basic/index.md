# Programming in BASIC

BASIC is the language your ACE speaks the moment it finishes booting. There is
nothing to install and nothing to set up. The `OK` on the screen is the language
waiting for you.

This half of the guide teaches it from the beginning. You do not need to have
programmed before. You do need an ACE switched on in front of you, or
[the emulator](/using/emulator) open, because every page here has something to
type.

## How to read this

Work through **Part I** in order. Each chapter is short, builds on the one
before it, and ends with a program you can run.

Then keep **Part II** to hand. It's the half you flip to at one in the morning
when you can't remember whether `MID$` counts from 0 or 1 — every keyword, every
error message, and an example of each.

::: tip Everything here is typed in upper case
The ACE's keyboard has no lower case, so BASIC doesn't either. Type it as it's
printed and you'll be fine.
:::

## The shortest possible program

If you have not typed anything into the machine yet, start here:

```
PRINT 6 * 7
```

```
 42

OK
```

You just wrote a program. It ran the moment you pressed <kbd>Enter</kbd>, which
is the first thing the next chapter is about.

## Part I — Learning it

| Chapter | What you get out of it |
|---|---|
| [Typing it in](/basic/typing-it-in) | Line numbers, `RUN`, `LIST`, and editing what you wrote |
| [Numbers and variables](/basic/numbers-and-variables) | Storing things, and what the machine can count to |
| [Showing things](/basic/print) | `PRINT` properly: columns, tabs, and neat output |
| [Asking questions](/basic/input) | `INPUT`, and what happens when the answer is nonsense |
| [Making decisions](/basic/decisions) | `IF`, `THEN`, `ELSE`, and the truth trap |
| [Going around again](/basic/loops) | `FOR`, `NEXT`, `STEP` |
| [Subroutines](/basic/subroutines) | `GOSUB`, `RETURN`, and menus with `ON` |
| [Arrays](/basic/arrays) | `DIM`, and holding a lot of numbers at once |
| [Working with words](/basic/strings) | Cutting up and gluing together text |
| [Lists in the program](/basic/data) | `DATA`, `READ`, `RESTORE` |
| [Your own functions](/basic/functions) | `DEF FN` |
| [Sound and video](/basic/sound-and-video) | `CLS`, `LOCATE`, `COLOR`, `SOUND`, `VOL` |
| [Sticks and keys](/basic/controls) | `INKEY`, `JOY`, `PAUSE`, `WAIT` |
| [Saving your work](/basic/files) | `SAVE`, `LOAD`, `BSAVE`, and the memory card |
| [Time and memory that lasts](/basic/clock) | `TIME`, `DATE`, `NVRAM` |
| [Reaching the machine](/basic/machine) | `PEEK`, `POKE`, `SYS`, `BANK` |
| [When it goes wrong](/basic/debugging) | `STOP`, `CONT`, and reading an error |
| [Programs worth typing](/basic/projects) | Eight finished programs, including a game |

## Part II — Looking it up

| Page | What's in it |
|---|---|
| [Every keyword](/basic/reference) | All 85 of them, with a working example each |
| [Every error message](/basic/errors) | What it means, and what to do about it |
| [What BASIC does with your memory](/basic/inside) | Where programs, variables and strings live |
