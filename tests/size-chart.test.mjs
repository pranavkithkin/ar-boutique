// Run: node --test tests/size-chart.test.mjs
import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"
import ts from "typescript"

const root = new URL("../", import.meta.url)
const read = (path) => fs.readFileSync(new URL(path, root), "utf8")

function load(path) {
  const { outputText, diagnostics } = ts.transpileModule(read(path), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    reportDiagnostics: true,
  })
  assert.equal(diagnostics?.length ?? 0, 0)
  const modObj = { exports: {} }
  vm.runInNewContext(outputText, {
    module: modObj,
    exports: modObj.exports,
  })
  return modObj.exports
}

const { SIZE_CHART_DATA } = load("lib/size-chart.ts")

test("SIZE_CHART_DATA matches client table exactly", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(SIZE_CHART_DATA)), [
    { size: "S", bust: 36, waist: 32, hip: 39, shoulder: "14", length: 28 },
    { size: "M", bust: 38, waist: 34, hip: 41, shoulder: "14.5", length: 30 },
    { size: "L", bust: 40, waist: 36, hip: 43, shoulder: "15", length: 32 },
    { size: "XL", bust: 42, waist: 38, hip: 45, shoulder: "15.5", length: 34 },
  ])
})
