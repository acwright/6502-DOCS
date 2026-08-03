#!/usr/bin/env node
// Placeholder for the Phase 1 toolchain preflight (see PLAN.md, Phase 1, task 4).
// Will check for `6502`, `cl65` (with W65C02 support), node >= 22, and the
// optional bastok/cffs/bin2woz tools.

const [major] = process.versions.node.split('.').map(Number)
if (major < 22) {
  console.error(`preflight: node >= 22 required, found ${process.version}`)
  process.exit(1)
}

console.log(`preflight: node ${process.version} ok (toolchain checks land in Phase 1)`)
