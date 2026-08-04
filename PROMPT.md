6502-DOCS
=========

The goal for this project is to create a documentation site for my 6502 family of homebrew computers. This should be a friendly users / programmers guide similar in nature to the C64 manuals. Create a multi-phase plan for this 
project and write the plan to PLAN.md in this repo. These docs should focus on system usage, programming in BASIC, setting up a cross dev enviroment (cc65, Makefile; see template projects), and programming in assembly for the systems. You should include helpful links
to websites that can assist in developing programs for this system. Images in the docs would be a nice thing to see. If you see an opportunity for an image in the docs that does not yet exist, placeholder it. If you can create it then do so.

Currently the documentation for the project is fragmented among README's or other documents in the various project repos. I don't want to abandon these README's as they serve a more technical purpose. If you spot inaccuracies in any README you
encounter be sure to fix it as we go.

There are various documents in the ASSETS repo that need to be replicated as HTML or moved to this repo. The ASSETS repo will be dropped from Github after the DOCS repo is live. Some of the documents in the ASSETS repo were
created with Affinity Designer and these files should be moved to this repo for now but they should be recreated as HTML. These documents are mostly in the form of quick reference sheets. I want the quick reference sheets to remain as part of the repo
and be linked in the docs but the info contained within should be ported to the docs. Everything that was a doc in that repo should be a quick reference card and the info in the documentation documents in this repo. These quick reference sheets must also be checked for accuracy. For example, most of the programs on the ACE quick reference sheet are un-runnable. 
Also, the various other repos should link the DOCS site (and/or repo) when it is live if appropriate.

Accuracy
--------

- Ensure claims made are accurate. Either check the BIOS, Emulator or the Kicad schematics themselves for truth. The emulator has cli with full agent power to verify any sample code or otherwise will run on the emulator and is installed on this system.

Architecture
------------

- Vitepress (preferably with no landing page; land directly in docs if possible)
- Deploy to Github pages
- Black and white (with grayscale) theme
- Bebas Neue font
- MIT license
- Be sure to include a README for this repo

Systems
--------

- /Users/acwright/Developer/Kicad/6502-ACE
- /Users/acwright/Developer/Kicad/6502-COB
- /Users/acwright/Developer/Kicad/6502-DEV
- /Users/acwright/Developer/Kicad/6502-KIM
- /Users/acwright/Developer/Kicad/6502-VCS

Resources
---------

- /Users/acwright/Developer/Assets/6502-ASSETS - Assets repo that will be dropped after DOCS repo exists
- /Users/acwright/Developer/Assembly/6502-BIOS - The source of truth for what the system can do. This is the software all computers run.
- /Users/acwright/Developer/NodeJS/6502-EMULATOR - The second source of truth. This is the main emulator for the family.
- /Users/acwright/Developer/Assembly/6502-CRT - Cartridge template project
- /Users/acwright/Developer/Assembly/6502-PRG - Program template project
- /Users/acwright/Developer/Assembly/6502-ASM - Assembly code sample repo
- /Users/acwright/Developer/BASIC/6502-BAS - BASIC code sample repo
- /Users/acwright/Developer/NodeJS/TMS9918-EDITOR - TMS9918 character / screen / sprite editor
- /Users/acwright/Developer/NodeJS/cffs - CF management tool
- /Users/acwright/Developer/NodeJS/bin2woz - Wozmon helper tool
- /Users/acwright/Developer/NodeJS/bastok - BASIC tokenizer