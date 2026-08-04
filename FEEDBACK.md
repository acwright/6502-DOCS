Phase 3 has been completed according to the plan document. However, I feel this project has gone off the rails a bit. I'm pausing now after phase 3 to see if we can redirect.

The main problem:

The AC6502 family of computers was created by me in stages in order to verify smaller pieces of the system one-by-one. I started this project with the COB system and its
individual boards and backplane verifying each part of the architecture along the way. I then built the DEV in order to have a first pass emulator and a way to step the CPU
and slow down the CPU etc. Having verified some of the main components were working I built the VCS with its Main board unifying some of the boards and its Input and Output
boards doing the same for the input and output IO respectively. Sometime after that I built the KIM as a fun side project to reuse the main board and replicate the KIM-1 to
some degree. Having built all that and verified it I unified everything into the ACE.

Now here is the important point: While the COB, DEV, VCS, and KIM still are part of AC6502 family, the ACE computer is the hero. It is the main show. I consider the COB, DEV,
VCS, and KIM now to be computers for anyone who is a true DIYer and wants to build one from the Github repo or wants a reference repo for their own 6502 builds. The exception to that 
is that the KIM can be though less as a standalone computer (although it can be built that way) and more of an accessory to the ACE. If you add the Keypad Card, Keypad LCD Helper, 
and Keypad Helper to the ACE you have converted the ACE to a KIM. The KIM is still a relavent and cool part of the ecosystem but it should be considered from the perspective of an add-on.

The ACE (or the emulator) should be the computer we assume this user's guide is for. The assumption should be that the user has an ACE (or the emulator) and didn't have to build it.
It is the "product". It is the thing I would ship if someone wanted to buy one of these. If I hand one of this families computers to a friend it would be the ACE. It is fully specced out just like
the emulator. Lets refocus the effort on the ACE. Perhaps COB, DEV, VCS, KIM can be mentioned in balloon tips, addendums or footnotes?

The second problem:

The feel of the documentation produced so far is off and it contains inaccuracies which we were aiming to prevent. Some of this is confusion over the many systems and is addressed by the above.
Some of it is my desire for accuracy which is baked into the plan. While I want to ensure accuracy in the documentation it should not actually creep INTO the documentation. I have found places in 
the already produced documentation where it seems the point of some of the sentences is to prove to another agent a claim is true. This has no place in the USER FOCUSED documentation we are trying
to produce. Also, it seems like the project itself is a massive js build-out of accuracy verifying tooling. I watched an agent literally scrape every single connection in the schematics. There is no need
for this unless we actually need to verify something. And even crazier, references to the accuracy building output are IN THE documentation!

Secondly, it is not very friendly. The focus of this documentation should be computer usage, programming in BASIC, programming in assembly, and helpful reference cards, tables, etc that can be
useful while OPERATING the computer. This should be the friendly user guide that came with the Commodore 64 or the VIC-20 plus some more advanced info for developers.

Some examples (from the already produced docs):

Welcome:

- "The same Kernal jump table, the same BASIC dialect, the same Monitor commands, work identically wherever you're sitting. What changes from machine to machine is which cards are fitted, not what the software can assume: every card the BIOS supports announces itself through a hardware probe at boot (HW_PRESENT, more in Troubleshooting), and code that checks before it uses a peripheral runs unmodified across the whole family." - Good info... but in the opening paragraph?? And also see "the main problem" above
- "What the machine is, according to the machine" - Huh? This has no place in a "users" guide unless the "user" is a robot verifying claims not learning how to use the 6502 computer. Doubly crazy is that its on the welcome page!!

Choosing your machine:

- "The table below is generated from data/systems.json" - My parents or friends who want to use this computer would say "huh?"
- "What's built in, what's optional" - Banked RAM (AS6C4008), Storage (ACE CF Adapter) not optional on the ACE. It has everything. This table in general also not formatted very well.

Setting Up:

- "A 5 V DC supply, barrel jack on ACE and VCS's Main Board; the COB Backplane Pro adds an onboard power switch (Rev 1.1) and its own barrel jack." - The VCS, KIM use the Main Board which has a USB-C power jack. The DEV is not mentioned but is powered through the Teensy's USB jack.
- "the BIOS talks to the module exactly as it would to a real TMS9918A (data/hardware.json's video slot, $9C00–$9FFF)" - Why are we referencing data/hardware.json? Is this written for an agent or the user?
- "ACE and VCS use an ATmega1284P running the AB Controller firmware" - The VCS has the Input Board which runs the IB Controller firmware. ACE uses AB Controller. COB uses KEH Controller. All do similar things but they are not the same firmware.
- "the exact bit layout is in data/hardware.json's joystick object)" - Again the referencing... but why not just show the user the bits?
- "(Kernal.asm:793 — lda #$1F ; 8-N-1, 19200 baud)" - Why are we referencing the assembly code here? Written for an agent for verification not a user.

First Power-On:

"Apply power (see Setting up if you haven't wired everything up yet) and this is what happens, in order — straight from data/boot.json, which is extracted from the BIOS source rather than described from memory:

Reset the stack pointer to $FF
KernalInit — probe and initialise every card, interrupts still disabled
Beep — guarded, skipped when no SID is fitted
If BOOT_VECTOR ($035B) is non-zero, jmp through it (cartridge takeover)
Halt if neither video nor serial is present — there is no console to boot into
cli, then draw the splash on whichever console this machine has
Wait ~5 s for ENTER or ESC; time out into BASIC
RUN-verified: booting the emulator headless with nothing but a carriage return waiting at the splash produces exactly this transcript —" - This whole thing feels like it was written to describe what an agent should expect
using the headless emulator not what a real user would experience.

Your first ten minutes:

"Everything below is typed at that prompt, and every line of it is a real, RUN-verified file in this repo — the prose can't drift from what the machine actually does, because it is what the machine actually does." - "Huh?" says the user. This was written as "proof" to an agent the claims are true. Not at all focused on the fun experience the user should be having in their first ten minutes.

The Keyboard:

"Every BASIC statement checks for two keys while a program runs: Ctrl+C (byte $03) and Esc (byte $1B)" - This is true... however I would suggest we encourage ESC as the main way to stop a BASIC loop.

Serial and XMODEM:

"What's RUN-verified here and what's GREP-only
This chapter draws a real line, on purpose: LOAD/SAVE switching to XModem mode is RUN-verified above — that's an observable console message, checked against the real emulator. The XModem wire protocol itself — 128-byte blocks, checksums, ACK/NAK/CAN, the retry counters — is read directly from Kernal.asm's XModemLoadImpl/XModemSaveImpl (GREP), not re-implemented and re-tested here. It's already exercised by 6502-BIOS's own test suite; this site borrows that source as its authority rather than duplicating a protocol implementation just to test documentation.

" - Entirely written for an agent not the user

Sound and Video:

"Sound — SOUND and VOL

10 VOL 10
20 SOUND 1, 440, 5
30 PRINT "PASS"
VOL n sets overall volume, 0–15. SOUND voice, freq, dur plays one note: voice is 1–3 (three independent SID voices), freq is in Hz, dur is in centiseconds (hundredths of a second) — SOUND 1, 440, 5 plays a concert-A for 50 ms on voice 1. The statement blocks for the duration, then silences the voice.

RUN-verified, and the interesting part is what happens with no sound card fitted at all: this sample runs on the default headless machine, which has no SID — and it reaches PASS anyway. BasCmdSound/BasCmdVol don't guard on HW_SID the way storage commands guard on HW_CF (BASIC.asm:8296, comment: "a game that beeps on a hit keeps playing on a machine with no sound"). Silence, not an error — the same graceful-degradation shape as video, described next." - Weird example (PASS line). Not written for a user. Similar problems with Video example.

The solution:

- Focus on the ACE
- Focus on friendliness and fun while still providing learning and good information

Make the needed changes to the PLAN.md document and work back towards where we are landed now at Phase 3 rewritting what has been produced and making any other changes to the repo architecture.