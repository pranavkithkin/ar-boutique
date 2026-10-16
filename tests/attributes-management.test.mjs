// Run: node --test tests/attributes-management.test.mjs
import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"
import { createRequire } from "node:module"
import ts from "typescript"

const require = createRequire(import.meta.url)
const root = new URL("../", import.meta.url)
const read = (path) => fs.readFileSync(new URL(path, root), "utf8")

function load(path, dependencies = {}) {
  const { outputText, diagnostics } = ts.transpileModule(read(path), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
  })
  assert.equal(diagnostics?.length ?? 0, 0)
  const modObj = { exports: {} }
  vm.runInNewContext(outputText, {
    module: modObj,
    exports: modObj.exports,
    require: (name) => dependencies[name] ?? require(name),
  })
  return modObj.exports
}

const { colourSchema, sizeSchema } = load("features/admin/attributes/schemas.ts")

test("colourSchema accepts valid colours with exact client naming and hex swatch (ADR-029)", () => {
  const validColour = {
    name: "Pine Green",
    swatch_hex: "#1B4D3E",
    is_active: true,
  }

  const parsed = colourSchema.safeParse(validColour)
  assert.equal(parsed.success, true)
  if (parsed.success) {
    assert.equal(parsed.data.name, "Pine Green")
    assert.equal(parsed.data.swatch_hex, "#1B4D3E")
  }
})

test("colourSchema accepts colour without swatch hex or null", () => {
  const colourNoHex = {
    name: "Pure Natural",
    swatch_hex: null,
    is_active: true,
  }

  const parsed = colourSchema.safeParse(colourNoHex)
  assert.equal(parsed.success, true)
})

test("colourSchema rejects empty colour name", () => {
  const invalidName = {
    name: "",
    swatch_hex: "#87CEEB",
    is_active: true,
  }

  const parsed = colourSchema.safeParse(invalidName)
  assert.equal(parsed.success, false)
})

test("colourSchema rejects invalid hex color formats", () => {
  const invalidHex = {
    name: "Crimson",
    swatch_hex: "crimson-not-hex",
    is_active: true,
  }

  const parsed = colourSchema.safeParse(invalidHex)
  assert.equal(parsed.success, false)
})

test("sizeSchema accepts standard and custom boutique sizes (ADR-029)", () => {
  for (const label of ["XS", "S", "M", "L", "XL", "XXL", "Free Size", "38 Regular"]) {
    const parsed = sizeSchema.safeParse({
      label,
      sort: 1,
      is_active: true,
    })
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.label, label) // strictly preserved
    }
  }
})

test("sizeSchema rejects empty size labels", () => {
  const parsed = sizeSchema.safeParse({
    label: "",
    sort: 0,
    is_active: true,
  })
  assert.equal(parsed.success, false)
})
