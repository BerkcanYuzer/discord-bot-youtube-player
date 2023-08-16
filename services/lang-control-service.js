const config = require("../config");
const en = require("../locales/en.json");
const tr = require("../locales/tr.json");

const lang = config.lang;
const locales = {
  en,
  tr,
};

const t = (key) => {
  if (locales[lang]?.hasOwnProperty(key)) {
    return locales[lang][key];
  }
  return "";
};

module.exports = {
  t,
};
