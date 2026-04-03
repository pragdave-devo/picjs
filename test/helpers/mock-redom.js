import * as redom from "redom"

global.SVGAnimatedLength = function() {}

redom.svg = function() {
  return {
    type: arguments[0],
    getAttribute(name) {
      return this[name]
    },
    removeAttribute(name) {
      delete this[name]
    },
  }
}
redom.setAttr = function(a, b) {
  return Object.assign(a, b)
}



