// @flow

import { RTE } from "./runtime_error.js"
import { TBase, TA } from "./types.js"
import { BuiltinConstants, BuiltinFunctions } from "./builtins.js"
import { DefaultsType } from "./defaults.js"

function jsonify(_key: any) {
  return `a binding`
}


export class Binding {

  children: Binding[] = []
  toJSON     = jsonify
  bindings: Record<string, TA> = {}
  defaults: DefaultsType = {}

  constructor(public outer: Binding | null = null, public level = 0) {
    if (outer)
      outer.children.push(this)
  }

  push() {
    return new Binding(this, this.level + 1)
  }

  pop() {
    return this.outer
  }

  isToplevel() {
    return !this.outer
  }

  set_variable(name: string, value: TA) {
    const home = this.findBindingContaining(name) || this
    this.checkIsTyped(name, value)
    home.bindings[name] = value
  }

  set_local_variable(name: string, value: TA) {
    this.bindings[name] = value
  }

  get_variable_value(name: string) {
    const home = this.findBindingContaining(name)
    if (home)
      return home.bindings[name]

    throw new RTE(`Variable '${name}' is not defined`)
  }

  findBindingContaining(name: string) {
    let home: Binding | null = this
    while (home) {
      if (name in home.bindings)
        break
      home = home.outer
    }
    return home
  }

  // defaults are different to variables:
  // - we always set them locally (but still search up the chain when fetching)
  // - when looking up, we use a four-level structure
  //
  //   - category: the name of the type of the thing (eg Shape or Animation)
  //   - the name of the actual class (eg SCircle)
  //   - the name of the myopic class of that type (eg .h1)
  //   - the name of the attribute
  //
  // Let's set the default fill for SBoxes to red, but for .action Boxes let's make it green:
  //
  //     Box.fill = ~red   (same as Box.fill.normal = ~red)
  //     Box.fill.action = ~green
  //
  //  When we set these, we always set them in the current binding, so we have
  //
  //      defaults[Shapes][SBox][.normal][fill] = TColor(red)
  //      defaults[Shapes][SBox][.action][fill] = TColor(green)
  //
  //  If we're looking up the default fill for a box with class .mybox, we won't find it, so we
  //  look instead in the ancestor bindings. If we don't find it there, we then repeat
  //  the search using the .normal class.
  //
  //  The overall ideas are:
  //  - any defaults set within a binding only apply in that binding.
  //  - the definitions of myopic classes fall back on the underlying .normal case,
  //    but the class name takes precedence
  //

  setDefault(category:string, shapeName:string, klass:string, attr:string, value: any) {
    const attrSet = [ category, shapeName, klass].
      reduce((ptr, name) => ptr[name] ||= {}, this.defaults)
    
    attrSet[attr] = value
  }


  getDefault(category:string, base:string, klass:string, attr: string): any {
    let result =  this.getDefaultByKlass(category, base, klass, attr)

    if (result) 
      return result

    if (klass !== `.normal`)
      result =  this.getDefaultByKlass(category, base, `.normal`, attr)

    if (result) 
      return result

    throw new Error(`unknown attribute in getDefault(${category}, ${base}, ${klass}, ${attr})`)
  }

  getDefaultByKlass(category:string, base:string, klass:string, attr:string): any {
    return (
      this.defaults?.[category]?.[base]?.[klass]?.[attr]
    ||
      (this.outer && this.outer.getDefaultByKlass(category, base, klass, attr)) 
    )
  }

  getAllDefaultAttributes(category:string, base:string, klass: string) {
    let result = {}
    if (this.outer) {
      result = this.outer.getAllDefaultAttributes(category, base, klass)
    }

    result = { ...result, ...this.getAllDefaultAttributesForKlass(category, base, `.normal`) }

    if (klass !== `.normal`) {
      result = { ...result, ...this.getAllDefaultAttributesForKlass(category, base, klass) }
    }

    return result
  }

  getAllDefaultAttributesForKlass(category:string, base:string, klass: string): any {
    return this.defaults?.[category]?.[base]?.[klass] || {}
  }

  bulkSetDefaults(defaults: DefaultsType) {
    if (this.outer)
      throw new Error(`bulkSetDefaults should only be used on the top-level binding`)

    this.defaults = defaults
  }

  addBuiltinFunctions() {
    Object.keys(BuiltinConstants).forEach(name => {
      this.set_local_variable(name, BuiltinConstants[name])
    })
    Object.keys(BuiltinFunctions).forEach(name => {
      this.set_local_variable(name, BuiltinFunctions[name])
    })
  }

  //////////////////////////////////////////////////////////////////////
  
  checkIsTyped(name: string, value: any) {
    if (!(value instanceof TBase)) {
      throw new RTE(
        `Value of "${name}" (${value}) is not a jp type\n\n` +
        this.dump()
      )
    }
  }

  dump() {
    let result = this.dumpMe()
    if (this.outer) {
      result += `\n\n` + this.outer.dump()
    }
    else {
      result += `\n\n-----\n\n`
    }
    return result
  }

  dumpMe() {
    return `Level: ${this.level}\n` +
      Object.entries(this.bindings).map(([n, v]) => `    ${n}: ${JSON.stringify(v)}`).join(`\n`) 
  }


  dumpAsTable() {
    return { "$level$": this.level, ...this.bindings }
  }

}
