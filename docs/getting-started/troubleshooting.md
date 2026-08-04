<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'
</script>

# When something's wrong

Symptom first. Find yours below.

## Nothing on the screen at all

Work through these in order:

1. **Is the power light on?** No light means no 5 V. Check the supply is
   centre-positive and actually delivering 5 V.
2. **Is the monitor on the right input?** VGA monitors are cheerfully silent
   about being on the wrong channel.
3. **Try the serial port.** If you have a USB-to-serial adapter, plug it in,
   open a terminal at 19200 8-N-1, and press reset. If the splash appears
   there, the computer is fine and the problem is the video path — cable,
   monitor, or the video module not seated.
4. **Press reset and listen.** A beep means the machine got as far as booting.

If there is genuinely nothing — no picture, no beep, no serial output — the
machine may have stopped before the splash because it couldn't find *any*
console. Get a serial cable on it; that's the fastest way to find out what it
thinks is going on.

## No sound

- Is the RCA lead going to something **powered**? The ACE puts out line level,
  not enough to drive a bare speaker.
- Have you set the volume? `VOL 15` at the prompt, then `SOUND 1, 440, 50`.
  You should get a beep.
- If the startup beep is missing too, the sound chip isn't being seen — check
  it's seated properly in its socket, and the right way round.

## No beep at startup, but everything else works

Same cause as above, and it's harmless: the machine skips the beep when it
can't find a sound chip rather than complaining about it. Everything else works
normally.

## The memory card isn't found

`DIR` says `?NO DEVICE ERROR` instead of listing files.

- Reseat the card. It should click in without force.
- Try a different card. Very large and very new CF cards sometimes don't
  support the 8-bit True IDE mode the ACE uses; anything from about 128 MB to
  8 GB is a safe bet.
- Check the CF adapter board is fully seated on the Storage header.

If `DIR` lists nothing but doesn't error, the card is fine and just empty —
`FORMAT` it and you're away. See [Storage](/using/storage).

## Keys repeating, or keys getting missed

Press reset first: the keyboard controller sets itself up at power-on and very
occasionally gets it wrong, and a reset makes it start over. Your program
survives, so this costs you nothing.

If one particular key is unreliable, it's the switch rather than the computer —
mechanical switches can be cleaned or replaced.

If you're using a PS/2 keyboard in place of the built-in one, try a different
keyboard: some USB keyboards with passive PS/2 adapters are only half-hearted
about supporting it.

## A program won't stop

Press <kbd>Esc</kbd>. If that doesn't do it — because the program is stuck in
machine code rather than BASIC — press reset. Your BASIC program is still in
memory afterwards.

## `?SYNTAX ERROR`

BASIC didn't understand the line. Nine times out of ten it's a typo:

```
PRIMT "HI"

?SYNTAX ERROR
OK
```

The other time, it's a keyword that doesn't exist in this BASIC. `LIST` and
look at the line carefully.

## Asking the machine what it thinks it has

There's one command that tells you what the ACE found when it looked itself
over at startup. Type `MEM`:

```
MEM
 30718 BYTES FREE  HW=$FF
DISK 0

OK
```

`HW=$FF` is a full house — everything present and accounted for. Anything less
means one of the pieces wasn't found, and the number tells you which:

::: details Reading the HW number
It's a hexadecimal number, and each bit stands for one part of the machine. Add
up the values for everything that's there:

<table>
  <thead><tr><th>Value</th><th>Part</th></tr></thead>
  <tbody>
    <tr v-for="slot in [...facts.hardware.slots].reverse()" :key="slot.symbol">
      <td><code>{{ slot.maskHex }}</code></td>
      <td>{{ slot.card }}</td>
    </tr>
  </tbody>
</table>

So `HW=$7F` is everything except video — which is exactly what you'd expect on
a machine being driven over a serial cable with no monitor attached. And
`HW=$FF` is everything.
:::

## Still stuck

The hardware itself — schematics, board revisions, bill of materials — is all
in the [6502-ACE repository](https://github.com/acwright/6502-ACE). If you're
chasing something at the board level, that's where to look.
