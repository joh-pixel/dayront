/* empty css                          */
import p from 'i18next';
import fsBackend from 'i18next-fs-backend';
import module2 from 'module';
import path2 from 'path';
import * as url2 from 'url';
import '@proload/core';
import '@proload/plugin-tsm';

module2.createRequire(import.meta.url);
const __filename$1 = url2.fileURLToPath(import.meta.url);
path2.dirname(__filename$1);
var A = (e) => {
  for (let n in e) n === "routes" && (y(e[n])), e[n];
}, y = (e, r = [], n = [], s = null) => {
  let o = s || {};
  for (let t in e) if (typeof e[t] == "object" && e[t] !== null) y(e[t], [...r, t], [...n, Object.prototype.hasOwnProperty.call(e[t], "index") ? e[t].index : t], o);
  else {
    let l = "/" + r.join("/"), i = "/" + n.join("/");
    t === "index" ? (o[l] = i, l += "/" + t, i += "/" + t, o[l] = i) : (l += "/" + t, i += "/" + e[t], o[l] = i);
  }
  return o;
};
function fe(e) {
  A(e);
}

p.use(fsBackend).init({
  "supportedLngs": ["cimode"],
  "fallbackLng": ["cimode"],
  "ns": "translation",
  "defaultNS": "translation",
  "initImmediate": false,
  "backend": {
    "loadPath": "/home/dayront/public/locales/{{lng}}/{{ns}}.json"
  }
});
fe({
  "defaultLocale": "cimode",
  "locales": ["cimode"],
  "namespaces": "translation",
  "defaultNamespace": "translation",
  "load": ["server"],
  "routes": {},
  "flatRoutes": {},
  "showDefaultLocale": false,
  "trailingSlash": "ignore",
  "resourcesBasePath": "/locales"
});
