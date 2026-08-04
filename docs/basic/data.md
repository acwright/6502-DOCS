# Lists in the program

When a program needs twenty numbers to start with, you don't want twenty
assignments. You want a list.

## DATA and READ

```
10 DATA 262, 294, 330
20 READ A, B, C
30 PRINT A; B; C
```

```
RUN
 262 294 330

OK
```

`DATA` lines hold values. `READ` takes the next one each time it's asked. The
`DATA` lines themselves do nothing when the program runs past them — they're
storage, not instructions.

Where you put them doesn't matter. Bottom of the program is conventional, and
next to the loop that reads them is kinder to whoever reads the listing.

## Reading a list you didn't count

Put a value on the end that can't be real, and stop when you see it:

<<< @/../samples/basic/shopping.bas{basic}

```
RUN
SHOPPING LIST

 1. BREAD
 2. MILK
 3. SOLDER
 4. COFFEE

 4 THINGS TO BUY

OK
```

That end marker is called a **sentinel**. `"END"` for text, `0` or `-1` for
numbers — anything that can't turn up in the real data. Now you can add items to
line 100 without touching anything else in the program.

The alternative is to count them yourself and put the count first:

```
10 DATA 4
20 DATA "BREAD", "MILK", "SOLDER", "COFFEE"
30 READ N
40 FOR I = 1 TO N
```

Which is fine right up until you add a fifth item and forget to change the 4.

## Reading past the end

Ask for one more than there is and the program stops:

```
?OUT OF DATA ERROR IN 30
```

That's usually a sentinel you forgot, or a `READ` inside a loop that goes round
once too often.

## Going back to the start

`RESTORE` puts the read position back at the first `DATA` item:

```
10 DATA 5, 6
20 READ A
30 RESTORE
40 READ B
50 PRINT A; B
```

```
RUN
 5 5

OK
```

Both `READ`s got the same value. `RESTORE` is what you call at the start of a
new game so the same `DATA` can be dealt out again.

## Mixing numbers and text

One `DATA` line can hold both, as long as the `READ` asks for them in the same
order:

```
10 DATA "TWINKLE", 262, "TWINKLE", 294
20 READ W$, F
```

Ask for a number where the next item is text and you get `?TYPE MISMATCH`.

## Where this really earns its keep

Tunes, maps, levels, sprite shapes, question-and-answer pairs. Anything you'd
otherwise type out as a hundred assignments. The [tune
player](/basic/projects#a-tune) is nothing but a `READ` loop with a
`DATA` melody, and adding a verse means adding a line.

Next: [naming a formula so you only write it once](/basic/functions).
