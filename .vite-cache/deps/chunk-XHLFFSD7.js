// node_modules/@lark-base-open/js-sdk/dist/chunk-4TBDLTQ7.mjs
var Pn = Object.create;
var ze = Object.defineProperty;
var Rn = Object.defineProperties;
var lr = Object.getOwnPropertyDescriptor;
var _n = Object.getOwnPropertyDescriptors;
var On = Object.getOwnPropertyNames;
var at = Object.getOwnPropertySymbols;
var fr = Object.getPrototypeOf;
var Rt = Object.prototype.hasOwnProperty;
var pr = Object.prototype.propertyIsEnumerable;
var An = Reflect.get;
var ur = (s, h, l2) => h in s ? ze(s, h, { enumerable: true, configurable: true, writable: true, value: l2 }) : s[h] = l2;
var Tn = (s, h) => {
  for (var l2 in h || (h = {})) Rt.call(h, l2) && ur(s, l2, h[l2]);
  if (at) for (var l2 of at(h)) pr.call(h, l2) && ur(s, l2, h[l2]);
  return s;
};
var Mn = (s, h) => Rn(s, _n(h));
var Nn = (s, h) => {
  var l2 = {};
  for (var v in s) Rt.call(s, v) && h.indexOf(v) < 0 && (l2[v] = s[v]);
  if (s != null && at) for (var v of at(s)) h.indexOf(v) < 0 && pr.call(s, v) && (l2[v] = s[v]);
  return l2;
};
var Ae = (s, h) => () => (h || s((h = { exports: {} }).exports, h), h.exports);
var Dn = (s, h) => {
  for (var l2 in h) ze(s, l2, { get: h[l2], enumerable: true });
};
var $n = (s, h, l2, v) => {
  if (h && typeof h == "object" || typeof h == "function") for (let j of On(h)) !Rt.call(s, j) && j !== l2 && ze(s, j, { get: () => h[j], enumerable: !(v = lr(h, j)) || v.enumerable });
  return s;
};
var zn = (s, h, l2) => (l2 = s != null ? Pn(fr(s)) : {}, $n(h || !s || !s.__esModule ? ze(l2, "default", { value: s, enumerable: true }) : l2, s));
var Fn = (s, h, l2, v) => {
  for (var j = v > 1 ? void 0 : v ? lr(h, l2) : h, q = s.length - 1, F; q >= 0; q--) (F = s[q]) && (j = (v ? F(h, l2, j) : F(j)) || j);
  return v && j && ze(h, l2, j), j;
};
var Ln = (s, h, l2) => An(fr(s), l2, h);
var Bn = (s, h, l2) => new Promise((v, j) => {
  var q = (V) => {
    try {
      K(l2.next(V));
    } catch (Q) {
      j(Q);
    }
  }, F = (V) => {
    try {
      K(l2.throw(V));
    } catch (Q) {
      j(Q);
    }
  }, K = (V) => V.done ? v(V.value) : Promise.resolve(V.value).then(q, F);
  K((l2 = l2.apply(s, h)).next());
});
var jn = Ae((s) => {
  var h = Symbol.for("react.element"), l2 = Symbol.for("react.portal"), v = Symbol.for("react.fragment"), j = Symbol.for("react.strict_mode"), q = Symbol.for("react.profiler"), F = Symbol.for("react.provider"), K = Symbol.for("react.context"), V = Symbol.for("react.forward_ref"), Q = Symbol.for("react.suspense"), ce = Symbol.for("react.memo"), _ = Symbol.for("react.lazy"), Y = Symbol.iterator;
  function te(a) {
    return a === null || typeof a != "object" ? null : (a = Y && a[Y] || a["@@iterator"], typeof a == "function" ? a : null);
  }
  var re = { isMounted: function() {
    return false;
  }, enqueueForceUpdate: function() {
  }, enqueueReplaceState: function() {
  }, enqueueSetState: function() {
  } }, se = Object.assign, W = {};
  function d(a, u, w) {
    this.props = a, this.context = u, this.refs = W, this.updater = w || re;
  }
  d.prototype.isReactComponent = {}, d.prototype.setState = function(a, u) {
    if (typeof a != "object" && typeof a != "function" && a != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, a, u, "setState");
  }, d.prototype.forceUpdate = function(a) {
    this.updater.enqueueForceUpdate(this, a, "forceUpdate");
  };
  function ue() {
  }
  ue.prototype = d.prototype;
  function B(a, u, w) {
    this.props = a, this.context = u, this.refs = W, this.updater = w || re;
  }
  var $e = B.prototype = new ue();
  $e.constructor = B, se($e, d.prototype), $e.isPureReactComponent = true;
  var je = Array.isArray, Fe = Object.prototype.hasOwnProperty, Ie = { current: null }, he = { key: true, ref: true, __self: true, __source: true };
  function me(a, u, w) {
    var O, P = {}, N = null, D = null;
    if (u != null) for (O in u.ref !== void 0 && (D = u.ref), u.key !== void 0 && (N = "" + u.key), u) Fe.call(u, O) && !he.hasOwnProperty(O) && (P[O] = u[O]);
    var z = arguments.length - 2;
    if (z === 1) P.children = w;
    else if (1 < z) {
      for (var R = Array(z), Z = 0; Z < z; Z++) R[Z] = arguments[Z + 2];
      P.children = R;
    }
    if (a && a.defaultProps) for (O in z = a.defaultProps, z) P[O] === void 0 && (P[O] = z[O]);
    return { $$typeof: h, type: a, key: N, ref: D, props: P, _owner: Ie.current };
  }
  function we(a, u) {
    return { $$typeof: h, type: a.type, key: u, ref: a.ref, props: a.props, _owner: a._owner };
  }
  function le(a) {
    return typeof a == "object" && a !== null && a.$$typeof === h;
  }
  function st(a) {
    var u = { "=": "=0", ":": "=2" };
    return "$" + a.replace(/[=:]/g, function(w) {
      return u[w];
    });
  }
  var Le = /\/+/g;
  function Ee(a, u) {
    return typeof a == "object" && a !== null && a.key != null ? st("" + a.key) : u.toString(36);
  }
  function xe(a, u, w, O, P) {
    var N = typeof a;
    (N === "undefined" || N === "boolean") && (a = null);
    var D = false;
    if (a === null) D = true;
    else switch (N) {
      case "string":
      case "number":
        D = true;
        break;
      case "object":
        switch (a.$$typeof) {
          case h:
          case l2:
            D = true;
        }
    }
    if (D) return D = a, P = P(D), a = O === "" ? "." + Ee(D, 0) : O, je(P) ? (w = "", a != null && (w = a.replace(Le, "$&/") + "/"), xe(P, u, w, "", function(Z) {
      return Z;
    })) : P != null && (le(P) && (P = we(P, w + (!P.key || D && D.key === P.key ? "" : ("" + P.key).replace(Le, "$&/") + "/") + a)), u.push(P)), 1;
    if (D = 0, O = O === "" ? "." : O + ":", je(a)) for (var z = 0; z < a.length; z++) {
      N = a[z];
      var R = O + Ee(N, z);
      D += xe(N, u, w, R, P);
    }
    else if (R = te(a), typeof R == "function") for (a = R.call(a), z = 0; !(N = a.next()).done; ) N = N.value, R = O + Ee(N, z++), D += xe(N, u, w, R, P);
    else if (N === "object") throw u = String(a), Error("Objects are not valid as a React child (found: " + (u === "[object Object]" ? "object with keys {" + Object.keys(a).join(", ") + "}" : u) + "). If you meant to render a collection of children, use an array instead.");
    return D;
  }
  function Ce(a, u, w) {
    if (a == null) return a;
    var O = [], P = 0;
    return xe(a, O, "", "", function(N) {
      return u.call(w, N, P++);
    }), O;
  }
  function it(a) {
    if (a._status === -1) {
      var u = a._result;
      u = u(), u.then(function(w) {
        (a._status === 0 || a._status === -1) && (a._status = 1, a._result = w);
      }, function(w) {
        (a._status === 0 || a._status === -1) && (a._status = 2, a._result = w);
      }), a._status === -1 && (a._status = 0, a._result = u);
    }
    if (a._status === 1) return a._result.default;
    throw a._result;
  }
  var U = { current: null }, ye = { transition: null }, Te = { ReactCurrentDispatcher: U, ReactCurrentBatchConfig: ye, ReactCurrentOwner: Ie };
  function Be() {
    throw Error("act(...) is not supported in production builds of React.");
  }
  s.Children = { map: Ce, forEach: function(a, u, w) {
    Ce(a, function() {
      u.apply(this, arguments);
    }, w);
  }, count: function(a) {
    var u = 0;
    return Ce(a, function() {
      u++;
    }), u;
  }, toArray: function(a) {
    return Ce(a, function(u) {
      return u;
    }) || [];
  }, only: function(a) {
    if (!le(a)) throw Error("React.Children.only expected to receive a single React element child.");
    return a;
  } }, s.Component = d, s.Fragment = v, s.Profiler = q, s.PureComponent = B, s.StrictMode = j, s.Suspense = Q, s.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Te, s.act = Be, s.cloneElement = function(a, u, w) {
    if (a == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
    var O = se({}, a.props), P = a.key, N = a.ref, D = a._owner;
    if (u != null) {
      if (u.ref !== void 0 && (N = u.ref, D = Ie.current), u.key !== void 0 && (P = "" + u.key), a.type && a.type.defaultProps) var z = a.type.defaultProps;
      for (R in u) Fe.call(u, R) && !he.hasOwnProperty(R) && (O[R] = u[R] === void 0 && z !== void 0 ? z[R] : u[R]);
    }
    var R = arguments.length - 2;
    if (R === 1) O.children = w;
    else if (1 < R) {
      z = Array(R);
      for (var Z = 0; Z < R; Z++) z[Z] = arguments[Z + 2];
      O.children = z;
    }
    return { $$typeof: h, type: a.type, key: P, ref: N, props: O, _owner: D };
  }, s.createContext = function(a) {
    return a = { $$typeof: K, _currentValue: a, _currentValue2: a, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, a.Provider = { $$typeof: F, _context: a }, a.Consumer = a;
  }, s.createElement = me, s.createFactory = function(a) {
    var u = me.bind(null, a);
    return u.type = a, u;
  }, s.createRef = function() {
    return { current: null };
  }, s.forwardRef = function(a) {
    return { $$typeof: V, render: a };
  }, s.isValidElement = le, s.lazy = function(a) {
    return { $$typeof: _, _payload: { _status: -1, _result: a }, _init: it };
  }, s.memo = function(a, u) {
    return { $$typeof: ce, type: a, compare: u === void 0 ? null : u };
  }, s.startTransition = function(a) {
    var u = ye.transition;
    ye.transition = {};
    try {
      a();
    } finally {
      ye.transition = u;
    }
  }, s.unstable_act = Be, s.useCallback = function(a, u) {
    return U.current.useCallback(a, u);
  }, s.useContext = function(a) {
    return U.current.useContext(a);
  }, s.useDebugValue = function() {
  }, s.useDeferredValue = function(a) {
    return U.current.useDeferredValue(a);
  }, s.useEffect = function(a, u) {
    return U.current.useEffect(a, u);
  }, s.useId = function() {
    return U.current.useId();
  }, s.useImperativeHandle = function(a, u, w) {
    return U.current.useImperativeHandle(a, u, w);
  }, s.useInsertionEffect = function(a, u) {
    return U.current.useInsertionEffect(a, u);
  }, s.useLayoutEffect = function(a, u) {
    return U.current.useLayoutEffect(a, u);
  }, s.useMemo = function(a, u) {
    return U.current.useMemo(a, u);
  }, s.useReducer = function(a, u, w) {
    return U.current.useReducer(a, u, w);
  }, s.useRef = function(a) {
    return U.current.useRef(a);
  }, s.useState = function(a) {
    return U.current.useState(a);
  }, s.useSyncExternalStore = function(a, u, w) {
    return U.current.useSyncExternalStore(a, u, w);
  }, s.useTransition = function() {
    return U.current.useTransition();
  }, s.version = "18.3.1";
});
var In = Ae((s, h) => {
  h.exports = jn();
});
var qn = Ae((s, h) => {
  (function(l2, v) {
    typeof s == "object" && typeof h != "undefined" ? h.exports = v(In()) : typeof define == "function" && define.amd ? define(["react"], v) : (l2 = l2 || self, l2.styled = v(l2.React));
  })(s, function(l2) {
    var v = typeof process != "undefined" && typeof process.env != "undefined" && (process.env.REACT_APP_SC_ATTR || process.env.SC_ATTR) || "data-styled", j = "active", q = "data-styled-version", F = "6.1.15", K = `/*!sc*/
`, V = typeof window != "undefined" && "HTMLElement" in window, Q = !!(typeof SC_DISABLE_SPEEDY == "boolean" ? SC_DISABLE_SPEEDY : typeof process != "undefined" && typeof process.env != "undefined" && typeof process.env.REACT_APP_SC_DISABLE_SPEEDY != "undefined" && process.env.REACT_APP_SC_DISABLE_SPEEDY !== "" ? process.env.REACT_APP_SC_DISABLE_SPEEDY !== "false" && process.env.REACT_APP_SC_DISABLE_SPEEDY : !(typeof process != "undefined" && typeof process.env != "undefined" && typeof process.env.SC_DISABLE_SPEEDY != "undefined" && process.env.SC_DISABLE_SPEEDY !== "") || process.env.SC_DISABLE_SPEEDY !== "false" && process.env.SC_DISABLE_SPEEDY), ce = {}, _ = function() {
      return _ = Object.assign || function(e) {
        for (var t, r = 1, n2 = arguments.length; r < n2; r++) {
          t = arguments[r];
          for (var o in t) Object.prototype.hasOwnProperty.call(t, o) && (e[o] = t[o]);
        }
        return e;
      }, _.apply(this, arguments);
    };
    function Y(e, t, r) {
      if (r || arguments.length === 2) for (var n2 = 0, o = t.length, i; n2 < o; n2++) (i || !(n2 in t)) && (i || (i = Array.prototype.slice.call(t, 0, n2)), i[n2] = t[n2]);
      return e.concat(i || Array.prototype.slice.call(t));
    }
    typeof SuppressedError == "function" && SuppressedError;
    var te = Object.freeze([]), re = Object.freeze({});
    function se(e, t) {
      Object.defineProperty(e, "toString", { value: t });
    }
    var W = { 1: `Cannot create styled-component for component: %s.

`, 2: `Can't collect styles once you've consumed a \`ServerStyleSheet\`'s styles! \`ServerStyleSheet\` is a one off instance for each server-side render cycle.

- Are you trying to reuse it across renders?
- Are you accidentally calling collectStyles twice?

`, 3: `Streaming SSR is only supported in a Node.js environment; Please do not try to call this method in the browser.

`, 4: `The \`StyleSheetManager\` expects a valid target or sheet prop!

- Does this error occur on the client and is your target falsy?
- Does this error occur on the server and is the sheet falsy?

`, 5: `The clone method cannot be used on the client!

- Are you running in a client-like environment on the server?
- Are you trying to run SSR on the client?

`, 6: `Trying to insert a new style tag, but the given Node is unmounted!

- Are you using a custom target that isn't mounted?
- Does your document not have a valid head element?
- Have you accidentally removed a style tag manually?

`, 7: 'ThemeProvider: Please return an object from your "theme" prop function, e.g.\n\n```js\ntheme={() => ({})}\n```\n\n', 8: `ThemeProvider: Please make your "theme" prop an object.

`, 9: "Missing document `<head>`\n\n", 10: `Cannot find a StyleSheet instance. Usually this happens if there are multiple copies of styled-components loaded at once. Check out this issue for how to troubleshoot and fix the common cases where this situation can happen: https://github.com/styled-components/styled-components/issues/1941#issuecomment-417862021

`, 11: `_This error was replaced with a dev-time warning, it will be deleted for v4 final._ [createGlobalStyle] received children which will not be rendered. Please use the component without passing children elements.

`, 12: "It seems you are interpolating a keyframe declaration (%s) into an untagged string. This was supported in styled-components v3, but is not longer supported in v4 as keyframes are now injected on-demand. Please wrap your string in the css\\`\\` helper which ensures the styles are injected correctly. See https://www.styled-components.com/docs/api#css\n\n", 13: `%s is not a styled component and cannot be referred to via component selector. See https://www.styled-components.com/docs/advanced#referring-to-other-components for more details.

`, 14: `ThemeProvider: "theme" prop is required.

`, 15: "A stylis plugin has been supplied that is not named. We need a name for each plugin to be able to prevent styling collisions between different stylis configurations within the same app. Before you pass your plugin to `<StyleSheetManager stylisPlugins={[]}>`, please make sure each plugin is uniquely-named, e.g.\n\n```js\nObject.defineProperty(importedPlugin, 'name', { value: 'some-unique-name' });\n```\n\n", 16: `Reached the limit of how many styled components may be created at group %s.
You may only create up to 1,073,741,824 components. If you're creating components dynamically,
as for instance in your render method then you may be running into this limitation.

`, 17: `CSSStyleSheet could not be found on HTMLStyleElement.
Has styled-components' style tag been unmounted or altered by another script?
`, 18: "ThemeProvider: Please make sure your useTheme hook is within a `<ThemeProvider>`" }, d = W;
    function ue() {
      for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
      for (var r = e[0], n2 = [], o = 1, i = e.length; o < i; o += 1) n2.push(e[o]);
      return n2.forEach(function(c) {
        r = r.replace(/%[a-z]/, c);
      }), r;
    }
    function B(e) {
      for (var t = [], r = 1; r < arguments.length; r++) t[r - 1] = arguments[r];
      return new Error(ue.apply(void 0, Y([d[e]], t, false)).trim());
    }
    var $e = function(e) {
      return new Fe(e);
    }, je = 512, Fe = function() {
      function e(t) {
        this.groupSizes = new Uint32Array(je), this.length = je, this.tag = t;
      }
      return e.prototype.indexOfGroup = function(t) {
        for (var r = 0, n2 = 0; n2 < t; n2++) r += this.groupSizes[n2];
        return r;
      }, e.prototype.insertRules = function(t, r) {
        if (t >= this.groupSizes.length) {
          for (var n2 = this.groupSizes, o = n2.length, i = o; t >= i; ) if (i <<= 1, i < 0) throw B(16, "".concat(t));
          this.groupSizes = new Uint32Array(i), this.groupSizes.set(n2), this.length = i;
          for (var c = o; c < i; c++) this.groupSizes[c] = 0;
        }
        for (var f = this.indexOfGroup(t + 1), c = 0, p = r.length; c < p; c++) this.tag.insertRule(f, r[c]) && (this.groupSizes[t]++, f++);
      }, e.prototype.clearGroup = function(t) {
        if (t < this.length) {
          var r = this.groupSizes[t], n2 = this.indexOfGroup(t), o = n2 + r;
          this.groupSizes[t] = 0;
          for (var i = n2; i < o; i++) this.tag.deleteRule(n2);
        }
      }, e.prototype.getGroup = function(t) {
        var r = "";
        if (t >= this.length || this.groupSizes[t] === 0) return r;
        for (var n2 = this.groupSizes[t], o = this.indexOfGroup(t), i = o + n2, c = o; c < i; c++) r += "".concat(this.tag.getRule(c)).concat(K);
        return r;
      }, e;
    }(), Ie = 1 << 31 - 1, he = /* @__PURE__ */ new Map(), me = /* @__PURE__ */ new Map(), we = 1, le = function(e) {
      if (he.has(e)) return he.get(e);
      for (; me.has(we); ) we++;
      var t = we++;
      if ((t | 0) < 0 || t > Ie) throw B(16, "".concat(t));
      return he.set(e, t), me.set(t, e), t;
    }, st = function(e) {
      return me.get(e);
    }, Le = function(e, t) {
      we = t + 1, he.set(e, t), me.set(t, e);
    }, Ee = "style[".concat(v, "][").concat(q, '="').concat(F, '"]'), xe = new RegExp("^".concat(v, '\\.g(\\d+)\\[id="([\\w\\d-]+)"\\].*?"([^"]*)')), Ce = function(e) {
      for (var t = e.getTag(), r = t.length, n2 = "", o = function(c) {
        var f = st(c);
        if (f === void 0) return "continue";
        var p = e.names.get(f), m2 = t.getGroup(c);
        if (p === void 0 || !p.size || m2.length === 0) return "continue";
        var b = "".concat(v, ".g").concat(c, '[id="').concat(f, '"]'), y = "";
        p !== void 0 && p.forEach(function(x) {
          x.length > 0 && (y += "".concat(x, ","));
        }), n2 += "".concat(m2).concat(b, '{content:"').concat(y, '"}').concat(K);
      }, i = 0; i < r; i++) o(i);
      return n2;
    }, it = function(e, t, r) {
      for (var n2 = r.split(","), o, i = 0, c = n2.length; i < c; i++) (o = n2[i]) && e.registerName(t, o);
    }, U = function(e, t) {
      for (var r, n2 = ((r = t.textContent) !== null && r !== void 0 ? r : "").split(K), o = [], i = 0, c = n2.length; i < c; i++) {
        var f = n2[i].trim();
        if (f) {
          var p = f.match(xe);
          if (p) {
            var m2 = parseInt(p[1], 10) | 0, b = p[2];
            m2 !== 0 && (Le(b, m2), it(e, b, p[3]), e.getTag().insertRules(m2, o)), o.length = 0;
          } else o.push(f);
        }
      }
    }, ye = function(e) {
      for (var t = document.querySelectorAll(Ee), r = 0, n2 = t.length; r < n2; r++) {
        var o = t[r];
        o && o.getAttribute(v) !== j && (U(e, o), o.parentNode && o.parentNode.removeChild(o));
      }
    };
    function Te() {
      return typeof __webpack_nonce__ != "undefined" ? __webpack_nonce__ : null;
    }
    var Be = function(e) {
      var t = Array.from(e.querySelectorAll("style[".concat(v, "]")));
      return t[t.length - 1];
    }, a = function(e) {
      var t = document.head, r = e || t, n2 = document.createElement("style"), o = Be(r), i = o !== void 0 ? o.nextSibling : null;
      n2.setAttribute(v, j), n2.setAttribute(q, F);
      var c = Te();
      return c && n2.setAttribute("nonce", c), r.insertBefore(n2, i), n2;
    }, u = function(e) {
      if (e.sheet) return e.sheet;
      for (var t = document.styleSheets, r = 0, n2 = t.length; r < n2; r++) {
        var o = t[r];
        if (o.ownerNode === e) return o;
      }
      throw B(17);
    }, w = function(e) {
      var t = e.isServer, r = e.useCSSOMInjection, n2 = e.target;
      return t ? new N(n2) : r ? new O(n2) : new P(n2);
    }, O = function() {
      function e(t) {
        this.element = a(t), this.element.appendChild(document.createTextNode("")), this.sheet = u(this.element), this.length = 0;
      }
      return e.prototype.insertRule = function(t, r) {
        try {
          return this.sheet.insertRule(r, t), this.length++, true;
        } catch (n2) {
          return false;
        }
      }, e.prototype.deleteRule = function(t) {
        this.sheet.deleteRule(t), this.length--;
      }, e.prototype.getRule = function(t) {
        var r = this.sheet.cssRules[t];
        return r && r.cssText ? r.cssText : "";
      }, e;
    }(), P = function() {
      function e(t) {
        this.element = a(t), this.nodes = this.element.childNodes, this.length = 0;
      }
      return e.prototype.insertRule = function(t, r) {
        if (t <= this.length && t >= 0) {
          var n2 = document.createTextNode(r), o = this.nodes[t];
          return this.element.insertBefore(n2, o || null), this.length++, true;
        } else return false;
      }, e.prototype.deleteRule = function(t) {
        this.element.removeChild(this.nodes[t]), this.length--;
      }, e.prototype.getRule = function(t) {
        return t < this.length ? this.nodes[t].textContent : "";
      }, e;
    }(), N = function() {
      function e(t) {
        this.rules = [], this.length = 0;
      }
      return e.prototype.insertRule = function(t, r) {
        return t <= this.length ? (this.rules.splice(t, 0, r), this.length++, true) : false;
      }, e.prototype.deleteRule = function(t) {
        this.rules.splice(t, 1), this.length--;
      }, e.prototype.getRule = function(t) {
        return t < this.length ? this.rules[t] : "";
      }, e;
    }(), D = V, z = { isServer: !V, useCSSOMInjection: !Q }, R = function() {
      function e(t, r, n2) {
        t === void 0 && (t = re), r === void 0 && (r = {});
        var o = this;
        this.options = _(_({}, z), t), this.gs = r, this.names = new Map(n2), this.server = !!t.isServer, !this.server && V && D && (D = false, ye(this)), se(this, function() {
          return Ce(o);
        });
      }
      return e.registerId = function(t) {
        return le(t);
      }, e.prototype.rehydrate = function() {
        !this.server && V && ye(this);
      }, e.prototype.reconstructWithOptions = function(t, r) {
        return r === void 0 && (r = true), new e(_(_({}, this.options), t), this.gs, r && this.names || void 0);
      }, e.prototype.allocateGSInstance = function(t) {
        return this.gs[t] = (this.gs[t] || 0) + 1;
      }, e.prototype.getTag = function() {
        return this.tag || (this.tag = $e(w(this.options)));
      }, e.prototype.hasNameForId = function(t, r) {
        return this.names.has(t) && this.names.get(t).has(r);
      }, e.prototype.registerName = function(t, r) {
        if (le(t), this.names.has(t)) this.names.get(t).add(r);
        else {
          var n2 = /* @__PURE__ */ new Set();
          n2.add(r), this.names.set(t, n2);
        }
      }, e.prototype.insertRules = function(t, r, n2) {
        this.registerName(t, r), this.getTag().insertRules(le(t), n2);
      }, e.prototype.clearNames = function(t) {
        this.names.has(t) && this.names.get(t).clear();
      }, e.prototype.clearRules = function(t) {
        this.getTag().clearGroup(le(t)), this.clearNames(t);
      }, e.prototype.clearTag = function() {
        this.tag = void 0;
      }, e;
    }(), Z = function(e, t, r, n2) {
      var o = r ? r.call(n2, e, t) : void 0;
      if (o !== void 0) return !!o;
      if (e === t) return true;
      if (typeof e != "object" || !e || typeof t != "object" || !t) return false;
      var i = Object.keys(e), c = Object.keys(t);
      if (i.length !== c.length) return false;
      for (var f = Object.prototype.hasOwnProperty.bind(t), p = 0; p < i.length; p++) {
        var m2 = i[p];
        if (!f(m2)) return false;
        var b = e[m2], y = t[m2];
        if (o = r ? r.call(n2, b, y, m2) : void 0, o === false || o === void 0 && b !== y) return false;
      }
      return true;
    }, E = "-ms-", Me = "-moz-", C = "-webkit-", _t = "comm", Ge = "rule", ct = "decl", dr = "@import", Ot = "@keyframes", hr = "@layer", At = Math.abs, ut = String.fromCharCode, lt = Object.assign;
    function mr(e, t) {
      return G(e, 0) ^ 45 ? (((t << 2 ^ G(e, 0)) << 2 ^ G(e, 1)) << 2 ^ G(e, 2)) << 2 ^ G(e, 3) : 0;
    }
    function $t(e) {
      return e.trim();
    }
    function ie(e, t) {
      return (e = t.exec(e)) ? e[0] : e;
    }
    function S(e, t, r) {
      return e.replace(t, r);
    }
    function He(e, t, r) {
      return e.indexOf(t, r);
    }
    function G(e, t) {
      return e.charCodeAt(t) | 0;
    }
    function ke(e, t, r) {
      return e.slice(t, r);
    }
    function ae(e) {
      return e.length;
    }
    function jt(e) {
      return e.length;
    }
    function Ne(e, t) {
      return t.push(e), e;
    }
    function yr(e, t) {
      return e.map(t).join("");
    }
    function It(e, t) {
      return e.filter(function(r) {
        return !ie(r, t);
      });
    }
    var qe = 1, Pe = 1, Et = 0, ee = 0, L = 0, Re = "";
    function We(e, t, r, n2, o, i, c, f) {
      return { value: e, root: t, parent: r, type: n2, props: o, children: i, line: qe, column: Pe, length: c, return: "", siblings: f };
    }
    function fe(e, t) {
      return lt(We("", null, null, "", null, null, 0, e.siblings), e, { length: -e.length }, t);
    }
    function _e(e) {
      for (; e.root; ) e = fe(e.root, { children: [e] });
      Ne(e, e.siblings);
    }
    function gr() {
      return L;
    }
    function vr() {
      return L = ee > 0 ? G(Re, --ee) : 0, Pe--, L === 10 && (Pe = 1, qe--), L;
    }
    function ne() {
      return L = ee < Et ? G(Re, ee++) : 0, Pe++, L === 10 && (Pe = 1, qe++), L;
    }
    function ge() {
      return G(Re, ee);
    }
    function Ue() {
      return ee;
    }
    function Ve(e, t) {
      return ke(Re, e, t);
    }
    function ft(e) {
      switch (e) {
        case 0:
        case 9:
        case 10:
        case 13:
        case 32:
          return 5;
        case 33:
        case 43:
        case 44:
        case 47:
        case 62:
        case 64:
        case 126:
        case 59:
        case 123:
        case 125:
          return 4;
        case 58:
          return 3;
        case 34:
        case 39:
        case 40:
        case 91:
          return 2;
        case 41:
        case 93:
          return 1;
      }
      return 0;
    }
    function Sr(e) {
      return qe = Pe = 1, Et = ae(Re = e), ee = 0, [];
    }
    function br(e) {
      return Re = "", e;
    }
    function pt(e) {
      return $t(Ve(ee - 1, dt(e === 91 ? e + 2 : e === 40 ? e + 1 : e)));
    }
    function wr(e) {
      for (; (L = ge()) && L < 33; ) ne();
      return ft(e) > 2 || ft(L) > 3 ? "" : " ";
    }
    function xr(e, t) {
      for (; --t && ne() && !(L < 48 || L > 102 || L > 57 && L < 65 || L > 70 && L < 97); ) ;
      return Ve(e, Ue() + (t < 6 && ge() == 32 && ne() == 32));
    }
    function dt(e) {
      for (; ne(); ) switch (L) {
        case e:
          return ee;
        case 34:
        case 39:
          e !== 34 && e !== 39 && dt(L);
          break;
        case 40:
          e === 41 && dt(e);
          break;
        case 92:
          ne();
          break;
      }
      return ee;
    }
    function Cr(e, t) {
      for (; ne() && e + L !== 47 + 10 && !(e + L === 42 + 42 && ge() === 47); ) ;
      return "/*" + Ve(t, ee - 1) + "*" + ut(e === 47 ? e : ne());
    }
    function kr(e) {
      for (; !ft(ge()); ) ne();
      return Ve(e, ee);
    }
    function Pr(e) {
      return br(Ye("", null, null, null, [""], e = Sr(e), 0, [0], e));
    }
    function Ye(e, t, r, n2, o, i, c, f, p) {
      for (var m2 = 0, b = 0, y = c, x = 0, g = 0, A = 0, k2 = 1, M = 1, H = 1, $ = 0, I = "", oe = o, X = i, J = n2, T = I; M; ) switch (A = $, $ = ne()) {
        case 40:
          if (A != 108 && G(T, y - 1) == 58) {
            He(T += S(pt($), "&", "&\f"), "&\f", At(m2 ? f[m2 - 1] : 0)) != -1 && (H = -1);
            break;
          }
        case 34:
        case 39:
        case 91:
          T += pt($);
          break;
        case 9:
        case 10:
        case 13:
        case 32:
          T += wr(A);
          break;
        case 92:
          T += xr(Ue() - 1, 7);
          continue;
        case 47:
          switch (ge()) {
            case 42:
            case 47:
              Ne(Rr(Cr(ne(), Ue()), t, r, p), p);
              break;
            default:
              T += "/";
          }
          break;
        case 123 * k2:
          f[m2++] = ae(T) * H;
        case 125 * k2:
        case 59:
        case 0:
          switch ($) {
            case 0:
            case 125:
              M = 0;
            case 59 + b:
              H == -1 && (T = S(T, /\f/g, "")), g > 0 && ae(T) - y && Ne(g > 32 ? Mt(T + ";", n2, r, y - 1, p) : Mt(S(T, " ", "") + ";", n2, r, y - 2, p), p);
              break;
            case 59:
              T += ";";
            default:
              if (Ne(J = Tt(T, t, r, m2, b, o, f, I, oe = [], X = [], y, i), i), $ === 123) if (b === 0) Ye(T, t, J, J, oe, i, y, f, X);
              else switch (x === 99 && G(T, 3) === 110 ? 100 : x) {
                case 100:
                case 108:
                case 109:
                case 115:
                  Ye(e, J, J, n2 && Ne(Tt(e, J, J, 0, 0, o, f, I, o, oe = [], y, X), X), o, X, y, f, n2 ? oe : X);
                  break;
                default:
                  Ye(T, J, J, J, [""], X, 0, f, X);
              }
          }
          m2 = b = g = 0, k2 = H = 1, I = T = "", y = c;
          break;
        case 58:
          y = 1 + ae(T), g = A;
        default:
          if (k2 < 1) {
            if ($ == 123) --k2;
            else if ($ == 125 && k2++ == 0 && vr() == 125) continue;
          }
          switch (T += ut($), $ * k2) {
            case 38:
              H = b > 0 ? 1 : (T += "\f", -1);
              break;
            case 44:
              f[m2++] = (ae(T) - 1) * H, H = 1;
              break;
            case 64:
              ge() === 45 && (T += pt(ne())), x = ge(), b = y = ae(I = T += kr(Ue())), $++;
              break;
            case 45:
              A === 45 && ae(T) == 2 && (k2 = 0);
          }
      }
      return i;
    }
    function Tt(e, t, r, n2, o, i, c, f, p, m2, b, y) {
      for (var x = o - 1, g = o === 0 ? i : [""], A = jt(g), k2 = 0, M = 0, H = 0; k2 < n2; ++k2) for (var $ = 0, I = ke(e, x + 1, x = At(M = c[k2])), oe = e; $ < A; ++$) (oe = $t(M > 0 ? g[$] + " " + I : S(I, /&\f/g, g[$]))) && (p[H++] = oe);
      return We(e, t, r, o === 0 ? Ge : f, p, m2, b, y);
    }
    function Rr(e, t, r, n2) {
      return We(e, t, r, _t, ut(gr()), ke(e, 2, -2), 0, n2);
    }
    function Mt(e, t, r, n2, o) {
      return We(e, t, r, ct, ke(e, 0, n2), ke(e, n2 + 1, -1), n2, o);
    }
    function Nt(e, t, r) {
      switch (mr(e, t)) {
        case 5103:
          return C + "print-" + e + e;
        case 5737:
        case 4201:
        case 3177:
        case 3433:
        case 1641:
        case 4457:
        case 2921:
        case 5572:
        case 6356:
        case 5844:
        case 3191:
        case 6645:
        case 3005:
        case 6391:
        case 5879:
        case 5623:
        case 6135:
        case 4599:
        case 4855:
        case 4215:
        case 6389:
        case 5109:
        case 5365:
        case 5621:
        case 3829:
          return C + e + e;
        case 4789:
          return Me + e + e;
        case 5349:
        case 4246:
        case 4810:
        case 6968:
        case 2756:
          return C + e + Me + e + E + e + e;
        case 5936:
          switch (G(e, t + 11)) {
            case 114:
              return C + e + E + S(e, /[svh]\w+-[tblr]{2}/, "tb") + e;
            case 108:
              return C + e + E + S(e, /[svh]\w+-[tblr]{2}/, "tb-rl") + e;
            case 45:
              return C + e + E + S(e, /[svh]\w+-[tblr]{2}/, "lr") + e;
          }
        case 6828:
        case 4268:
        case 2903:
          return C + e + E + e + e;
        case 6165:
          return C + e + E + "flex-" + e + e;
        case 5187:
          return C + e + S(e, /(\w+).+(:[^]+)/, C + "box-$1$2" + E + "flex-$1$2") + e;
        case 5443:
          return C + e + E + "flex-item-" + S(e, /flex-|-self/g, "") + (ie(e, /flex-|baseline/) ? "" : E + "grid-row-" + S(e, /flex-|-self/g, "")) + e;
        case 4675:
          return C + e + E + "flex-line-pack" + S(e, /align-content|flex-|-self/g, "") + e;
        case 5548:
          return C + e + E + S(e, "shrink", "negative") + e;
        case 5292:
          return C + e + E + S(e, "basis", "preferred-size") + e;
        case 6060:
          return C + "box-" + S(e, "-grow", "") + C + e + E + S(e, "grow", "positive") + e;
        case 4554:
          return C + S(e, /([^-])(transform)/g, "$1" + C + "$2") + e;
        case 6187:
          return S(S(S(e, /(zoom-|grab)/, C + "$1"), /(image-set)/, C + "$1"), e, "") + e;
        case 5495:
        case 3959:
          return S(e, /(image-set\([^]*)/, C + "$1$`$1");
        case 4968:
          return S(S(e, /(.+:)(flex-)?(.*)/, C + "box-pack:$3" + E + "flex-pack:$3"), /s.+-b[^;]+/, "justify") + C + e + e;
        case 4200:
          if (!ie(e, /flex-|baseline/)) return E + "grid-column-align" + ke(e, t) + e;
          break;
        case 2592:
        case 3360:
          return E + S(e, "template-", "") + e;
        case 4384:
        case 3616:
          return r && r.some(function(n2, o) {
            return t = o, ie(n2.props, /grid-\w+-end/);
          }) ? ~He(e + (r = r[t].value), "span", 0) ? e : E + S(e, "-start", "") + e + E + "grid-row-span:" + (~He(r, "span", 0) ? ie(r, /\d+/) : +ie(r, /\d+/) - +ie(e, /\d+/)) + ";" : E + S(e, "-start", "") + e;
        case 4896:
        case 4128:
          return r && r.some(function(n2) {
            return ie(n2.props, /grid-\w+-start/);
          }) ? e : E + S(S(e, "-end", "-span"), "span ", "") + e;
        case 4095:
        case 3583:
        case 4068:
        case 2532:
          return S(e, /(.+)-inline(.+)/, C + "$1$2") + e;
        case 8116:
        case 7059:
        case 5753:
        case 5535:
        case 5445:
        case 5701:
        case 4933:
        case 4677:
        case 5533:
        case 5789:
        case 5021:
        case 4765:
          if (ae(e) - 1 - t > 6) switch (G(e, t + 1)) {
            case 109:
              if (G(e, t + 4) !== 45) break;
            case 102:
              return S(e, /(.+:)(.+)-([^]+)/, "$1" + C + "$2-$3$1" + Me + (G(e, t + 3) == 108 ? "$3" : "$2-$3")) + e;
            case 115:
              return ~He(e, "stretch", 0) ? Nt(S(e, "stretch", "fill-available"), t, r) + e : e;
          }
          break;
        case 5152:
        case 5920:
          return S(e, /(.+?):(\d+)(\s*\/\s*(span)?\s*(\d+))?(.*)/, function(n2, o, i, c, f, p, m2) {
            return E + o + ":" + i + m2 + (c ? E + o + "-span:" + (f ? p : +p - +i) + m2 : "") + e;
          });
        case 4949:
          if (G(e, t + 6) === 121) return S(e, ":", ":" + C) + e;
          break;
        case 6444:
          switch (G(e, G(e, 14) === 45 ? 18 : 11)) {
            case 120:
              return S(e, /(.+:)([^;\s!]+)(;|(\s+)?!.+)?/, "$1" + C + (G(e, 14) === 45 ? "inline-" : "") + "box$3$1" + C + "$2$3$1" + E + "$2box$3") + e;
            case 100:
              return S(e, ":", ":" + E) + e;
          }
          break;
        case 5719:
        case 2647:
        case 2135:
        case 3927:
        case 2391:
          return S(e, "scroll-", "scroll-snap-") + e;
      }
      return e;
    }
    function Xe(e, t) {
      for (var r = "", n2 = 0; n2 < e.length; n2++) r += t(e[n2], n2, e, t) || "";
      return r;
    }
    function _r(e, t, r, n2) {
      switch (e.type) {
        case hr:
          if (e.children.length) break;
        case dr:
        case ct:
          return e.return = e.return || e.value;
        case _t:
          return "";
        case Ot:
          return e.return = e.value + "{" + Xe(e.children, n2) + "}";
        case Ge:
          if (!ae(e.value = e.props.join(","))) return "";
      }
      return ae(r = Xe(e.children, n2)) ? e.return = e.value + "{" + r + "}" : "";
    }
    function Or(e) {
      var t = jt(e);
      return function(r, n2, o, i) {
        for (var c = "", f = 0; f < t; f++) c += e[f](r, n2, o, i) || "";
        return c;
      };
    }
    function Ar(e) {
      return function(t) {
        t.root || (t = t.return) && e(t);
      };
    }
    function $r(e, t, r, n2) {
      if (e.length > -1 && !e.return) switch (e.type) {
        case ct:
          e.return = Nt(e.value, e.length, r);
          return;
        case Ot:
          return Xe([fe(e, { value: S(e.value, "@", "@" + C) })], n2);
        case Ge:
          if (e.length) return yr(r = e.props, function(o) {
            switch (ie(o, n2 = /(::plac\w+|:read-\w+)/)) {
              case ":read-only":
              case ":read-write":
                _e(fe(e, { props: [S(o, /:(read-\w+)/, ":" + Me + "$1")] })), _e(fe(e, { props: [o] })), lt(e, { props: It(r, n2) });
                break;
              case "::placeholder":
                _e(fe(e, { props: [S(o, /:(plac\w+)/, ":" + C + "input-$1")] })), _e(fe(e, { props: [S(o, /:(plac\w+)/, ":" + Me + "$1")] })), _e(fe(e, { props: [S(o, /:(plac\w+)/, E + "input-$1")] })), _e(fe(e, { props: [o] })), lt(e, { props: It(r, n2) });
                break;
            }
            return "";
          });
      }
    }
    var Dt = 5381, ve = function(e, t) {
      for (var r = t.length; r; ) e = e * 33 ^ t.charCodeAt(--r);
      return e;
    }, zt = function(e) {
      return ve(Dt, e);
    }, jr = /&/g, Ir = /^\s*\/\/.*$/gm;
    function Ft(e, t) {
      return e.map(function(r) {
        return r.type === "rule" && (r.value = "".concat(t, " ").concat(r.value), r.value = r.value.replaceAll(",", ",".concat(t, " ")), r.props = r.props.map(function(n2) {
          return "".concat(t, " ").concat(n2);
        })), Array.isArray(r.children) && r.type !== "@keyframes" && (r.children = Ft(r.children, t)), r;
      });
    }
    function Lt(e) {
      var t = e === void 0 ? re : e, r = t.options, n2 = r === void 0 ? re : r, o = t.plugins, i = o === void 0 ? te : o, c, f, p, m2 = function(g, A, k2) {
        return k2.startsWith(f) && k2.endsWith(f) && k2.replaceAll(f, "").length > 0 ? ".".concat(c) : g;
      }, b = function(g) {
        g.type === Ge && g.value.includes("&") && (g.props[0] = g.props[0].replace(jr, f).replace(p, m2));
      }, y = i.slice();
      y.push(b), n2.prefix && y.push($r), y.push(_r);
      var x = function(g, A, k2, M) {
        A === void 0 && (A = ""), k2 === void 0 && (k2 = ""), M === void 0 && (M = "&"), c = M, f = A, p = new RegExp("\\".concat(f, "\\b"), "g");
        var H = g.replace(Ir, ""), $ = Pr(k2 || A ? "".concat(k2, " ").concat(A, " { ").concat(H, " }") : H);
        n2.namespace && ($ = Ft($, n2.namespace));
        var I = [];
        return Xe($, Or(y.concat(Ar(function(oe) {
          return I.push(oe);
        })))), I;
      };
      return x.hash = i.length ? i.reduce(function(g, A) {
        return A.name || B(15), ve(g, A.name);
      }, Dt).toString() : "", x;
    }
    var Bt = new R(), ht = Lt(), Je = l2.createContext({ shouldForwardProp: void 0, styleSheet: Bt, stylis: ht }), Er = Je.Consumer, Tr = l2.createContext(void 0);
    function Ke() {
      return l2.useContext(Je);
    }
    function Gt(e) {
      var t = l2.useState(e.stylisPlugins), r = t[0], n2 = t[1], o = Ke().styleSheet, i = l2.useMemo(function() {
        var p = o;
        return e.sheet ? p = e.sheet : e.target && (p = p.reconstructWithOptions({ target: e.target }, false)), e.disableCSSOMInjection && (p = p.reconstructWithOptions({ useCSSOMInjection: false })), p;
      }, [e.disableCSSOMInjection, e.sheet, e.target, o]), c = l2.useMemo(function() {
        return Lt({ options: { namespace: e.namespace, prefix: e.enableVendorPrefixes }, plugins: r });
      }, [e.enableVendorPrefixes, e.namespace, r]);
      l2.useEffect(function() {
        Z(r, e.stylisPlugins) || n2(e.stylisPlugins);
      }, [e.stylisPlugins]);
      var f = l2.useMemo(function() {
        return { shouldForwardProp: e.shouldForwardProp, styleSheet: i, stylis: c };
      }, [e.shouldForwardProp, i, c]);
      return l2.createElement(Je.Provider, { value: f }, l2.createElement(Tr.Provider, { value: c }, e.children));
    }
    var mt = function() {
      function e(t, r) {
        var n2 = this;
        this.inject = function(o, i) {
          i === void 0 && (i = ht);
          var c = n2.name + i.hash;
          o.hasNameForId(n2.id, c) || o.insertRules(n2.id, c, i(n2.rules, c, "@keyframes"));
        }, this.name = t, this.id = "sc-keyframes-".concat(t), this.rules = r, se(this, function() {
          throw B(12, String(n2.name));
        });
      }
      return e.prototype.getName = function(t) {
        return t === void 0 && (t = ht), this.name + t.hash;
      }, e;
    }(), Mr = { animationIterationCount: 1, aspectRatio: 1, borderImageOutset: 1, borderImageSlice: 1, borderImageWidth: 1, boxFlex: 1, boxFlexGroup: 1, boxOrdinalGroup: 1, columnCount: 1, columns: 1, flex: 1, flexGrow: 1, flexPositive: 1, flexShrink: 1, flexNegative: 1, flexOrder: 1, gridRow: 1, gridRowEnd: 1, gridRowSpan: 1, gridRowStart: 1, gridColumn: 1, gridColumnEnd: 1, gridColumnSpan: 1, gridColumnStart: 1, msGridRow: 1, msGridRowSpan: 1, msGridColumn: 1, msGridColumnSpan: 1, fontWeight: 1, lineHeight: 1, opacity: 1, order: 1, orphans: 1, tabSize: 1, widows: 1, zIndex: 1, zoom: 1, WebkitLineClamp: 1, fillOpacity: 1, floodOpacity: 1, stopOpacity: 1, strokeDasharray: 1, strokeDashoffset: 1, strokeMiterlimit: 1, strokeOpacity: 1, strokeWidth: 1 };
    function Nr(e, t) {
      return t == null || typeof t == "boolean" || t === "" ? "" : typeof t == "number" && t !== 0 && !(e in Mr) && !e.startsWith("--") ? "".concat(t, "px") : String(t).trim();
    }
    function Ze(e) {
      return typeof e == "string" && e || e.displayName || e.name || "Component";
    }
    var Dr = function(e) {
      return e >= "A" && e <= "Z";
    };
    function Ht(e) {
      for (var t = "", r = 0; r < e.length; r++) {
        var n2 = e[r];
        if (r === 1 && n2 === "-" && e[0] === "-") return e;
        Dr(n2) ? t += "-" + n2.toLowerCase() : t += n2;
      }
      return t.startsWith("ms-") ? "-" + t : t;
    }
    function Se(e) {
      return typeof e == "function";
    }
    function Oe(e) {
      return e !== null && typeof e == "object" && e.constructor.name === Object.name && !("props" in e && e.$$typeof);
    }
    function zr(e) {
      return Se(e) && !(e.prototype && e.prototype.isReactComponent);
    }
    function Qe(e) {
      return typeof e == "object" && "styledComponentId" in e;
    }
    var qt = function(e) {
      return e == null || e === false || e === "";
    }, Wt = function(e) {
      var t = [];
      for (var r in e) {
        var n2 = e[r];
        !e.hasOwnProperty(r) || qt(n2) || (Array.isArray(n2) && n2.isCss || Se(n2) ? t.push("".concat(Ht(r), ":"), n2, ";") : Oe(n2) ? t.push.apply(t, Y(Y(["".concat(r, " {")], Wt(n2), false), ["}"], false)) : t.push("".concat(Ht(r), ": ").concat(Nr(r, n2), ";")));
      }
      return t;
    };
    function pe(e, t, r, n2) {
      if (qt(e)) return [];
      if (Qe(e)) return [".".concat(e.styledComponentId)];
      if (Se(e)) if (zr(e) && t) {
        var o = e(t);
        return typeof o == "object" && !Array.isArray(o) && !(o instanceof mt) && !Oe(o) && o !== null && console.error("".concat(Ze(e), " is not a styled component and cannot be referred to via component selector. See https://www.styled-components.com/docs/advanced#referring-to-other-components for more details.")), pe(o, t, r, n2);
      } else return [e];
      return e instanceof mt ? r ? (e.inject(r, n2), [e.getName(n2)]) : [e] : Oe(e) ? Wt(e) : Array.isArray(e) ? Fr(e, function(i) {
        return pe(i, t, r, n2);
      }) : [e.toString()];
    }
    function Fr(e, t) {
      return Array.prototype.concat.apply(te, e.map(t));
    }
    function Lr(e) {
      for (var t = 0; t < e.length; t += 1) {
        var r = e[t];
        if (Se(r) && !Qe(r)) return false;
      }
      return true;
    }
    function be(e, t) {
      return e && t ? "".concat(e, " ").concat(t) : e || t || "";
    }
    function De(e, t) {
      if (e.length === 0) return "";
      for (var r = e[0], n2 = 1; n2 < e.length; n2++) r += t ? t + e[n2] : e[n2];
      return r;
    }
    var Br = function() {
      function e(t, r) {
        this.rules = t, this.componentId = r, this.isStatic = Lr(t), R.registerId(this.componentId + 1);
      }
      return e.prototype.createStyles = function(t, r, n2, o) {
        var i = De(pe(this.rules, r, n2, o)), c = o(i, ""), f = this.componentId + t;
        n2.insertRules(f, f, c);
      }, e.prototype.removeStyles = function(t, r) {
        r.clearRules(this.componentId + t);
      }, e.prototype.renderStyles = function(t, r, n2, o) {
        t > 2 && R.registerId(this.componentId + t), this.removeStyles(t, n2), this.createStyles(t, r, n2, o);
      }, e;
    }(), de = l2.createContext(void 0), Gr = de.Consumer;
    function Hr(e, t) {
      if (!e) throw B(14);
      if (Se(e)) {
        var r = e, n2 = r(t);
        if (n2 === null || Array.isArray(n2) || typeof n2 != "object") throw B(7);
        return n2;
      }
      if (Array.isArray(e) || typeof e != "object") throw B(8);
      return t ? _(_({}, t), e) : e;
    }
    function qr() {
      var e = l2.useContext(de);
      if (!e) throw B(18);
      return e;
    }
    function Wr(e) {
      var t = l2.useContext(de), r = l2.useMemo(function() {
        return Hr(e.theme, t);
      }, [e.theme, t]);
      return e.children ? l2.createElement(de.Provider, { value: r }, e.children) : null;
    }
    var Ut = /invalid hook call/i, et = /* @__PURE__ */ new Set(), Vt = function(e, t) {
      {
        var r = t ? ' with the id of "'.concat(t, '"') : "", n2 = "The component ".concat(e).concat(r, ` has been created dynamically.
`) + `You may see this warning because you've called styled inside another component.
To resolve this only create new StyledComponents outside of any render method and function component.`, o = console.error;
        try {
          var i = true;
          console.error = function(c) {
            for (var f = [], p = 1; p < arguments.length; p++) f[p - 1] = arguments[p];
            Ut.test(c) ? (i = false, et.delete(n2)) : o.apply(void 0, Y([c], f, false));
          }, l2.useRef(), i && !et.has(n2) && (console.warn(n2), et.add(n2));
        } catch (c) {
          Ut.test(c.message) && et.delete(n2);
        } finally {
          console.error = o;
        }
      }
    };
    function yt(e, t, r) {
      return r === void 0 && (r = re), e.theme !== r.theme && e.theme || t || r.theme;
    }
    var Ur = /(a)(d)/gi, tt = 52, Yt = function(e) {
      return String.fromCharCode(e + (e > 25 ? 39 : 97));
    };
    function gt(e) {
      var t = "", r;
      for (r = Math.abs(e); r > tt; r = r / tt | 0) t = Yt(r % tt) + t;
      return (Yt(r % tt) + t).replace(Ur, "$1-$2");
    }
    function vt(e) {
      return gt(zt(e) >>> 0);
    }
    function Xt(e, t) {
      for (var r = [e[0]], n2 = 0, o = t.length; n2 < o; n2 += 1) r.push(t[n2], e[n2 + 1]);
      return r;
    }
    var Jt = function(e) {
      return Object.assign(e, { isCss: true });
    };
    function rt(e) {
      for (var t = [], r = 1; r < arguments.length; r++) t[r - 1] = arguments[r];
      if (Se(e) || Oe(e)) {
        var n2 = e;
        return Jt(pe(Xt(te, Y([n2], t, true))));
      }
      var o = e;
      return t.length === 0 && o.length === 1 && typeof o[0] == "string" ? pe(o) : Jt(pe(Xt(o, t)));
    }
    function Vr(e) {
      for (var t = [], r = 1; r < arguments.length; r++) t[r - 1] = arguments[r];
      var n2 = rt.apply(void 0, Y([e], t, false)), o = "sc-global-".concat(vt(JSON.stringify(n2))), i = new Br(n2, o);
      Vt(o);
      var c = function(p) {
        var m2 = Ke(), b = l2.useContext(de), y = l2.useRef(m2.styleSheet.allocateGSInstance(o)), x = y.current;
        return l2.Children.count(p.children) && console.warn("The global style component ".concat(o, " was given child JSX. createGlobalStyle does not render children.")), n2.some(function(g) {
          return typeof g == "string" && g.indexOf("@import") !== -1;
        }) && console.warn("Please do not use @import CSS syntax in createGlobalStyle at this time, as the CSSOM APIs we use in production do not handle it well. Instead, we recommend using a library such as react-helmet to inject a typical <link> meta tag to the stylesheet, or simply embedding it manually in your index.html <head> section for a simpler app."), m2.styleSheet.server && f(x, p, m2.styleSheet, b, m2.stylis), l2.useLayoutEffect(function() {
          if (!m2.styleSheet.server) return f(x, p, m2.styleSheet, b, m2.stylis), function() {
            return i.removeStyles(x, m2.styleSheet);
          };
        }, [x, p, m2.styleSheet, b, m2.stylis]), null;
      };
      function f(p, m2, b, y, x) {
        if (i.isStatic) i.renderStyles(p, ce, b, x);
        else {
          var g = _(_({}, m2), { theme: yt(m2, y, c.defaultProps) });
          i.renderStyles(p, g, b, x);
        }
      }
      return l2.memo(c);
    }
    function Yr(e) {
      for (var t = [], r = 1; r < arguments.length; r++) t[r - 1] = arguments[r];
      typeof navigator != "undefined" && navigator.product === "ReactNative" && console.warn("`keyframes` cannot be used on ReactNative, only on the web. To do animation in ReactNative please use Animated.");
      var n2 = De(rt.apply(void 0, Y([e], t, false))), o = vt(n2);
      return new mt(o, n2);
    }
    var nt, Kt = typeof Symbol == "function" && Symbol.for, Zt = Kt ? Symbol.for("react.memo") : 60115, Xr = Kt ? Symbol.for("react.forward_ref") : 60112, Jr = { childContextTypes: true, contextType: true, contextTypes: true, defaultProps: true, displayName: true, getDefaultProps: true, getDerivedStateFromError: true, getDerivedStateFromProps: true, mixins: true, propTypes: true, type: true }, Kr = { name: true, length: true, prototype: true, caller: true, callee: true, arguments: true, arity: true }, Zr = { $$typeof: true, render: true, defaultProps: true, displayName: true, propTypes: true }, Qt = { $$typeof: true, compare: true, defaultProps: true, displayName: true, propTypes: true, type: true }, Qr = (nt = {}, nt[Xr] = Zr, nt[Zt] = Qt, nt);
    function en(e) {
      var t = "type" in e && e.type.$$typeof;
      return t === Zt;
    }
    function er(e) {
      return en(e) ? Qt : "$$typeof" in e ? Qr[e.$$typeof] : Jr;
    }
    var tn = Object.defineProperty, rn = Object.getOwnPropertyNames, tr = Object.getOwnPropertySymbols, nn = Object.getOwnPropertyDescriptor, on = Object.getPrototypeOf, rr = Object.prototype;
    function St(e, t, r) {
      if (typeof t != "string") {
        if (rr) {
          var n2 = on(t);
          n2 && n2 !== rr && St(e, n2, r);
        }
        var o = rn(t);
        tr && (o = o.concat(tr(t)));
        for (var i = er(e), c = er(t), f = 0; f < o.length; ++f) {
          var p = o[f];
          if (!(p in Kr) && !(r && r[p]) && !(c && p in c) && !(i && p in i)) {
            var m2 = nn(t, p);
            try {
              tn(e, p, m2);
            } catch (b) {
            }
          }
        }
      }
      return e;
    }
    function an(e) {
      var t = l2.forwardRef(function(r, n2) {
        var o = l2.useContext(de), i = yt(r, o, e.defaultProps);
        return i === void 0 && console.warn('[withTheme] You are not using a ThemeProvider nor passing a theme prop or a theme in defaultProps in component class "'.concat(Ze(e), '"')), l2.createElement(e, _({}, r, { theme: i, ref: n2 }));
      });
      return t.displayName = "WithTheme(".concat(Ze(e), ")"), St(t, e);
    }
    var sn = function() {
      function e() {
        var t = this;
        this._emitSheetCSS = function() {
          var r = t.instance.toString();
          if (!r) return "";
          var n2 = Te(), o = [n2 && 'nonce="'.concat(n2, '"'), "".concat(v, '="true"'), "".concat(q, '="').concat(F, '"')], i = De(o.filter(Boolean), " ");
          return "<style ".concat(i, ">").concat(r, "</style>");
        }, this.getStyleTags = function() {
          if (t.sealed) throw B(2);
          return t._emitSheetCSS();
        }, this.getStyleElement = function() {
          var r;
          if (t.sealed) throw B(2);
          var n2 = t.instance.toString();
          if (!n2) return [];
          var o = (r = {}, r[v] = "", r[q] = F, r.dangerouslySetInnerHTML = { __html: n2 }, r), i = Te();
          return i && (o.nonce = i), [l2.createElement("style", _({}, o, { key: "sc-0-0" }))];
        }, this.seal = function() {
          t.sealed = true;
        }, this.instance = new R({ isServer: true }), this.sealed = false;
      }
      return e.prototype.collectStyles = function(t) {
        if (this.sealed) throw B(2);
        return l2.createElement(Gt, { sheet: this.instance }, t);
      }, e.prototype.interleaveWithNodeStream = function(t) {
        throw B(3);
      }, e;
    }(), cn = { StyleSheet: R, mainSheet: Bt };
    typeof navigator != "undefined" && navigator.product === "ReactNative" && console.warn(`It looks like you've imported 'styled-components' on React Native.
Perhaps you're looking to import 'styled-components/native'?
Read more about this at https://www.styled-components.com/docs/basics#react-native`);
    var ot = "__sc-".concat(v, "__");
    typeof window != "undefined" && (window[ot] || (window[ot] = 0), window[ot] === 1 && console.warn(`It looks like there are several instances of 'styled-components' initialized in this application. This may cause dynamic styles to not render properly, errors during the rehydration process, a missing theme prop, and makes your application bigger without good reason.

See https://s-c.sh/2BAXzed for more info.`), window[ot] += 1);
    var nr = Object.freeze({ __proto__: null, ServerStyleSheet: sn, StyleSheetConsumer: Er, StyleSheetContext: Je, StyleSheetManager: Gt, ThemeConsumer: Gr, ThemeContext: de, ThemeProvider: Wr, __PRIVATE__: cn, createGlobalStyle: Vr, css: rt, isStyledComponent: Qe, keyframes: Yr, useTheme: qr, version: F, withTheme: an });
    function un(e) {
      var t = /* @__PURE__ */ Object.create(null);
      return function(r) {
        return t[r] === void 0 && (t[r] = e(r)), t[r];
      };
    }
    var ln = /^((children|dangerouslySetInnerHTML|key|ref|autoFocus|defaultValue|defaultChecked|innerHTML|suppressContentEditableWarning|suppressHydrationWarning|valueLink|abbr|accept|acceptCharset|accessKey|action|allow|allowUserMedia|allowPaymentRequest|allowFullScreen|allowTransparency|alt|async|autoComplete|autoPlay|capture|cellPadding|cellSpacing|challenge|charSet|checked|cite|classID|className|cols|colSpan|content|contentEditable|contextMenu|controls|controlsList|coords|crossOrigin|data|dateTime|decoding|default|defer|dir|disabled|disablePictureInPicture|disableRemotePlayback|download|draggable|encType|enterKeyHint|form|formAction|formEncType|formMethod|formNoValidate|formTarget|frameBorder|headers|height|hidden|high|href|hrefLang|htmlFor|httpEquiv|id|inputMode|integrity|is|keyParams|keyType|kind|label|lang|list|loading|loop|low|marginHeight|marginWidth|max|maxLength|media|mediaGroup|method|min|minLength|multiple|muted|name|nonce|noValidate|open|optimum|pattern|placeholder|playsInline|poster|preload|profile|radioGroup|readOnly|referrerPolicy|rel|required|reversed|role|rows|rowSpan|sandbox|scope|scoped|scrolling|seamless|selected|shape|size|sizes|slot|span|spellCheck|src|srcDoc|srcLang|srcSet|start|step|style|summary|tabIndex|target|title|translate|type|useMap|value|width|wmode|wrap|about|datatype|inlist|prefix|property|resource|typeof|vocab|autoCapitalize|autoCorrect|autoSave|color|incremental|fallback|inert|itemProp|itemScope|itemType|itemID|itemRef|on|option|results|security|unselectable|accentHeight|accumulate|additive|alignmentBaseline|allowReorder|alphabetic|amplitude|arabicForm|ascent|attributeName|attributeType|autoReverse|azimuth|baseFrequency|baselineShift|baseProfile|bbox|begin|bias|by|calcMode|capHeight|clip|clipPathUnits|clipPath|clipRule|colorInterpolation|colorInterpolationFilters|colorProfile|colorRendering|contentScriptType|contentStyleType|cursor|cx|cy|d|decelerate|descent|diffuseConstant|direction|display|divisor|dominantBaseline|dur|dx|dy|edgeMode|elevation|enableBackground|end|exponent|externalResourcesRequired|fill|fillOpacity|fillRule|filter|filterRes|filterUnits|floodColor|floodOpacity|focusable|fontFamily|fontSize|fontSizeAdjust|fontStretch|fontStyle|fontVariant|fontWeight|format|from|fr|fx|fy|g1|g2|glyphName|glyphOrientationHorizontal|glyphOrientationVertical|glyphRef|gradientTransform|gradientUnits|hanging|horizAdvX|horizOriginX|ideographic|imageRendering|in|in2|intercept|k|k1|k2|k3|k4|kernelMatrix|kernelUnitLength|kerning|keyPoints|keySplines|keyTimes|lengthAdjust|letterSpacing|lightingColor|limitingConeAngle|local|markerEnd|markerMid|markerStart|markerHeight|markerUnits|markerWidth|mask|maskContentUnits|maskUnits|mathematical|mode|numOctaves|offset|opacity|operator|order|orient|orientation|origin|overflow|overlinePosition|overlineThickness|panose1|paintOrder|pathLength|patternContentUnits|patternTransform|patternUnits|pointerEvents|points|pointsAtX|pointsAtY|pointsAtZ|preserveAlpha|preserveAspectRatio|primitiveUnits|r|radius|refX|refY|renderingIntent|repeatCount|repeatDur|requiredExtensions|requiredFeatures|restart|result|rotate|rx|ry|scale|seed|shapeRendering|slope|spacing|specularConstant|specularExponent|speed|spreadMethod|startOffset|stdDeviation|stemh|stemv|stitchTiles|stopColor|stopOpacity|strikethroughPosition|strikethroughThickness|string|stroke|strokeDasharray|strokeDashoffset|strokeLinecap|strokeLinejoin|strokeMiterlimit|strokeOpacity|strokeWidth|surfaceScale|systemLanguage|tableValues|targetX|targetY|textAnchor|textDecoration|textRendering|textLength|to|transform|u1|u2|underlinePosition|underlineThickness|unicode|unicodeBidi|unicodeRange|unitsPerEm|vAlphabetic|vHanging|vIdeographic|vMathematical|values|vectorEffect|version|vertAdvY|vertOriginX|vertOriginY|viewBox|viewTarget|visibility|widths|wordSpacing|writingMode|x|xHeight|x1|x2|xChannelSelector|xlinkActuate|xlinkArcrole|xlinkHref|xlinkRole|xlinkShow|xlinkTitle|xlinkType|xmlBase|xmlns|xmlnsXlink|xmlLang|xmlSpace|y|y1|y2|yChannelSelector|z|zoomAndPan|for|class|autofocus)|(([Dd][Aa][Tt][Aa]|[Aa][Rr][Ii][Aa]|x)-.*))$/, fn = un(function(e) {
      return ln.test(e) || e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) < 91;
    }), or = 200, pn = function(e, t) {
      var r = {}, n2 = false;
      return function(o) {
        if (!n2 && (r[o] = true, Object.keys(r).length >= or)) {
          var i = t ? ' with the id of "'.concat(t, '"') : "";
          console.warn("Over ".concat(or, " classes were generated for component ").concat(e).concat(i, `.
`) + `Consider using the attrs method, together with a style object for frequently changed styles.
Example:
  const Component = styled.div.attrs(props => ({
    style: {
      background: props.background,
    },
  }))\`width: 100%;\`

  <Component />`), n2 = true, r = {};
        }
      };
    }, dn = ["a", "abbr", "address", "area", "article", "aside", "audio", "b", "base", "bdi", "bdo", "big", "blockquote", "body", "br", "button", "canvas", "caption", "cite", "code", "col", "colgroup", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "html", "i", "iframe", "img", "input", "ins", "kbd", "keygen", "label", "legend", "li", "link", "main", "map", "mark", "menu", "menuitem", "meta", "meter", "nav", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "script", "section", "select", "small", "source", "span", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "u", "ul", "use", "var", "video", "wbr", "circle", "clipPath", "defs", "ellipse", "foreignObject", "g", "image", "line", "linearGradient", "marker", "mask", "path", "pattern", "polygon", "polyline", "radialGradient", "rect", "stop", "svg", "text", "tspan"], bt = new Set(dn), hn = /[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~-]+/g, mn = /(^-|-$)/g;
    function ar(e) {
      return e.replace(hn, "-").replace(mn, "");
    }
    function wt(e) {
      return typeof e == "string" && e.charAt(0) === e.charAt(0).toLowerCase();
    }
    function yn(e) {
      return wt(e) ? "styled.".concat(e) : "Styled(".concat(Ze(e), ")");
    }
    function xt(e, t, r) {
      if (r === void 0 && (r = false), !r && !Oe(e) && !Array.isArray(e)) return t;
      if (Array.isArray(t)) for (var n2 = 0; n2 < t.length; n2++) e[n2] = xt(e[n2], t[n2]);
      else if (Oe(t)) for (var n2 in t) e[n2] = xt(e[n2], t[n2]);
      return e;
    }
    function gn(e) {
      for (var t = [], r = 1; r < arguments.length; r++) t[r - 1] = arguments[r];
      for (var n2 = 0, o = t; n2 < o.length; n2++) {
        var i = o[n2];
        xt(e, i, true);
      }
      return e;
    }
    var vn = zt(F), Sn = function() {
      function e(t, r, n2) {
        this.rules = t, this.staticRulesId = "", this.isStatic = false, this.componentId = r, this.baseHash = ve(vn, r), this.baseStyle = n2, R.registerId(r);
      }
      return e.prototype.generateAndInjectStyles = function(t, r, n2) {
        var o = this.baseStyle ? this.baseStyle.generateAndInjectStyles(t, r, n2) : "";
        if (this.isStatic && !n2.hash) if (this.staticRulesId && r.hasNameForId(this.componentId, this.staticRulesId)) o = be(o, this.staticRulesId);
        else {
          var i = De(pe(this.rules, t, r, n2)), c = gt(ve(this.baseHash, i) >>> 0);
          if (!r.hasNameForId(this.componentId, c)) {
            var f = n2(i, ".".concat(c), void 0, this.componentId);
            r.insertRules(this.componentId, c, f);
          }
          o = be(o, c), this.staticRulesId = c;
        }
        else {
          for (var p = ve(this.baseHash, n2.hash), m2 = "", b = 0; b < this.rules.length; b++) {
            var y = this.rules[b];
            if (typeof y == "string") m2 += y, p = ve(p, y);
            else if (y) {
              var x = De(pe(y, t, r, n2));
              p = ve(p, x + b), m2 += x;
            }
          }
          if (m2) {
            var g = gt(p >>> 0);
            r.hasNameForId(this.componentId, g) || r.insertRules(this.componentId, g, n2(m2, ".".concat(g), void 0, this.componentId)), o = be(o, g);
          }
        }
        return o;
      }, e;
    }(), Ct = {};
    function bn(e, t) {
      var r = typeof e != "string" ? "sc" : ar(e);
      Ct[r] = (Ct[r] || 0) + 1;
      var n2 = "".concat(r, "-").concat(vt(F + r + Ct[r]));
      return t ? "".concat(t, "-").concat(n2) : n2;
    }
    function wn(e, t) {
      var r = Ke(), n2 = e.generateAndInjectStyles(t, r.styleSheet, r.stylis);
      return l2.useDebugValue(n2), n2;
    }
    function xn(e, t, r) {
      for (var n2 = _(_({}, t), { className: void 0, theme: r }), o, i = 0; i < e.length; i += 1) {
        o = e[i];
        var c = Se(o) ? o(n2) : o;
        for (var f in c) n2[f] = f === "className" ? be(n2[f], c[f]) : f === "style" ? _(_({}, n2[f]), c[f]) : c[f];
      }
      return t.className && (n2.className = be(n2.className, t.className)), n2;
    }
    var sr = /* @__PURE__ */ new Set();
    function Cn(e, t, r) {
      var n2 = e.attrs, o = e.componentStyle, i = e.defaultProps, c = e.foldedComponentIds, f = e.styledComponentId, p = e.target, m2 = l2.useContext(de), b = Ke(), y = e.shouldForwardProp || b.shouldForwardProp;
      l2.useDebugValue(f);
      var x = yt(t, m2, i) || re, g = xn(n2, t, x), A = g.as || p, k2 = {};
      for (var M in g) g[M] === void 0 || M[0] === "$" || M === "as" || M === "theme" && g.theme === x || (M === "forwardedAs" ? k2.as = g.forwardedAs : (!y || y(M, A)) && (k2[M] = g[M], !y && !fn(M) && !sr.has(M) && bt.has(A) && (sr.add(M), console.warn('styled-components: it looks like an unknown prop "'.concat(M, '" is being sent through to the DOM, which will likely trigger a React console error. If you would like automatic filtering of unknown props, you can opt-into that behavior via `<StyleSheetManager shouldForwardProp={...}>` (connect an API like `@emotion/is-prop-valid`) or consider using transient props (`$` prefix for automatic filtering.)')))));
      var H = wn(o, g);
      e.warnTooManyClasses && e.warnTooManyClasses(H);
      var $ = be(c, f);
      return H && ($ += " " + H), g.className && ($ += " " + g.className), k2[wt(A) && !bt.has(A) ? "class" : "className"] = $, r && (k2.ref = r), l2.createElement(A, k2);
    }
    function kn(e, t, r) {
      var n2 = Qe(e), o = e, i = !wt(e), c = t.attrs, f = c === void 0 ? te : c, p = t.componentId, m2 = p === void 0 ? bn(t.displayName, t.parentComponentId) : p, b = t.displayName, y = b === void 0 ? yn(e) : b, x = t.displayName && t.componentId ? "".concat(ar(t.displayName), "-").concat(t.componentId) : t.componentId || m2, g = n2 && o.attrs ? o.attrs.concat(f).filter(Boolean) : f, A = t.shouldForwardProp;
      if (n2 && o.shouldForwardProp) {
        var k2 = o.shouldForwardProp;
        if (t.shouldForwardProp) {
          var M = t.shouldForwardProp;
          A = function(X, J) {
            return k2(X, J) && M(X, J);
          };
        } else A = k2;
      }
      var H = new Sn(r, x, n2 ? o.componentStyle : void 0);
      function $(X, J) {
        return Cn(I, X, J);
      }
      $.displayName = y;
      var I = l2.forwardRef($);
      if (I.attrs = g, I.componentStyle = H, I.displayName = y, I.shouldForwardProp = A, I.foldedComponentIds = n2 ? be(o.foldedComponentIds, o.styledComponentId) : "", I.styledComponentId = x, I.target = n2 ? o.target : e, Object.defineProperty(I, "defaultProps", { get: function() {
        return this._foldedDefaultProps;
      }, set: function(X) {
        this._foldedDefaultProps = n2 ? gn({}, o.defaultProps, X) : X;
      } }), Vt(y, x), I.warnTooManyClasses = pn(y, x), se(I, function() {
        return ".".concat(I.styledComponentId);
      }), i) {
        var oe = e;
        St(I, oe, { attrs: true, componentStyle: true, displayName: true, foldedComponentIds: true, shouldForwardProp: true, styledComponentId: true, target: true });
      }
      return I;
    }
    function kt(e, t, r) {
      if (r === void 0 && (r = re), !t) throw B(1, t);
      var n2 = function(o) {
        for (var i = [], c = 1; c < arguments.length; c++) i[c - 1] = arguments[c];
        return e(t, r, rt.apply(void 0, Y([o], i, false)));
      };
      return n2.attrs = function(o) {
        return kt(e, t, _(_({}, r), { attrs: Array.prototype.concat(r.attrs, o).filter(Boolean) }));
      }, n2.withConfig = function(o) {
        return kt(e, t, _(_({}, r), o));
      }, n2;
    }
    var ir = function(e) {
      return kt(kn, e);
    }, Pt = ir;
    bt.forEach(function(e) {
      Pt[e] = ir(e);
    });
    for (var cr in nr) Pt[cr] = nr[cr];
    return Pt;
  });
});
var En = Ae((s) => {
  var h = Symbol.for("react.element"), l2 = Symbol.for("react.portal"), v = Symbol.for("react.fragment"), j = Symbol.for("react.strict_mode"), q = Symbol.for("react.profiler"), F = Symbol.for("react.provider"), K = Symbol.for("react.context"), V = Symbol.for("react.server_context"), Q = Symbol.for("react.forward_ref"), ce = Symbol.for("react.suspense"), _ = Symbol.for("react.suspense_list"), Y = Symbol.for("react.memo"), te = Symbol.for("react.lazy"), re = Symbol.for("react.offscreen"), se;
  se = Symbol.for("react.module.reference");
  function W(d) {
    if (typeof d == "object" && d !== null) {
      var ue = d.$$typeof;
      switch (ue) {
        case h:
          switch (d = d.type, d) {
            case v:
            case q:
            case j:
            case ce:
            case _:
              return d;
            default:
              switch (d = d && d.$$typeof, d) {
                case V:
                case K:
                case Q:
                case te:
                case Y:
                case F:
                  return d;
                default:
                  return ue;
              }
          }
        case l2:
          return ue;
      }
    }
  }
  s.ContextConsumer = K, s.ContextProvider = F, s.Element = h, s.ForwardRef = Q, s.Fragment = v, s.Lazy = te, s.Memo = Y, s.Portal = l2, s.Profiler = q, s.StrictMode = j, s.Suspense = ce, s.SuspenseList = _, s.isAsyncMode = function() {
    return false;
  }, s.isConcurrentMode = function() {
    return false;
  }, s.isContextConsumer = function(d) {
    return W(d) === K;
  }, s.isContextProvider = function(d) {
    return W(d) === F;
  }, s.isElement = function(d) {
    return typeof d == "object" && d !== null && d.$$typeof === h;
  }, s.isForwardRef = function(d) {
    return W(d) === Q;
  }, s.isFragment = function(d) {
    return W(d) === v;
  }, s.isLazy = function(d) {
    return W(d) === te;
  }, s.isMemo = function(d) {
    return W(d) === Y;
  }, s.isPortal = function(d) {
    return W(d) === l2;
  }, s.isProfiler = function(d) {
    return W(d) === q;
  }, s.isStrictMode = function(d) {
    return W(d) === j;
  }, s.isSuspense = function(d) {
    return W(d) === ce;
  }, s.isSuspenseList = function(d) {
    return W(d) === _;
  }, s.isValidElementType = function(d) {
    return typeof d == "string" || typeof d == "function" || d === v || d === q || d === j || d === ce || d === _ || d === re || typeof d == "object" && d !== null && (d.$$typeof === te || d.$$typeof === Y || d.$$typeof === F || d.$$typeof === K || d.$$typeof === Q || d.$$typeof === se || d.getModuleId !== void 0);
  }, s.typeOf = W;
});
var Wn = Ae((s, h) => {
  h.exports = En();
});

// node_modules/@lark-base-open/js-sdk/dist/chunk-QKDQG6NO.mjs
var k = Object.defineProperty;
var l = Object.getOwnPropertyDescriptor;
var m = (h, d, b, e) => {
  for (var a = e > 1 ? void 0 : e ? l(d, b) : d, f = h.length - 1, g; f >= 0; f--) (g = h[f]) && (a = (e ? g(d, b, a) : g(a)) || a);
  return e && a && k(d, b, a), a;
};
var n = (h, d, b) => new Promise((e, a) => {
  var f = (c) => {
    try {
      i(b.next(c));
    } catch (j) {
      a(j);
    }
  }, g = (c) => {
    try {
      i(b.throw(c));
    } catch (j) {
      a(j);
    }
  }, i = (c) => c.done ? e(c.value) : Promise.resolve(c.value).then(f, g);
  i((b = b.apply(h, d)).next());
});

export {
  Tn,
  Mn,
  Nn,
  Ae,
  Dn,
  zn,
  Fn,
  Ln,
  Bn,
  In,
  qn,
  Wn,
  m,
  n
};
/*! Bundled license information:

@lark-base-open/js-sdk/dist/chunk-4TBDLTQ7.mjs:
  (*! Bundled license information:
  
  react/cjs/react.production.min.js:
    (**
     * @license React
     * react.production.min.js
     *
     * Copyright (c) Facebook, Inc. and its affiliates.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     *)
  
  react-is/cjs/react-is.production.min.js:
    (**
     * @license React
     * react-is.production.min.js
     *
     * Copyright (c) Facebook, Inc. and its affiliates.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     *)
  *)
*/
//# sourceMappingURL=chunk-XHLFFSD7.js.map
