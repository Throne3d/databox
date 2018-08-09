/*
Changelog:
2018-08-01 3.0:
- Again, re-organized everything

2015-10-16 2.0:
- Re-organised all the code.
*/

/* TODO:
- Extract report calculation, since it seems heavily duplicated
- Turn returns of errors into throws
- Deduplicate setting defaults somewhere
- Fix "getMaxTroop("spy") <= leaveShapeTroops.spy" calls
- Ensure code actually functions as expected (some stuff has broken in the modernization)
- Use TypeScript?
- Prompt user for world-specific data if it can't be found (eg timezones); else figure out a way to generate these without relying on a hardcoded list
*/

/*The standard data.*/
var serverTimezones = {
  en: "GMT+0000",
  zz: "GMT+0100",
  no: "GMT+0100"
};
var resourceRates = [0, 30, 35, 41, 47, 55, 64, 74, 86, 100, 117, 136, 158, 184, 214, 249, 289, 337, 391, 455, 530, 616, 717, 833, 969, 1127, 1311, 1525, 1774, 2063, 2400];
var warehouseCapacity = [0, 1000, 1229, 1512, 1859, 2285, 2810, 3454, 4247, 5222, 6420, 7893, 9705, 11932, 14670, 18037, 22177, 27266, 33523, 41217, 50675, 62305, 76604, 94184, 115798, 142373, 175047, 215219, 264611, 325337, 400000];
var unitCarry = {
  spear: 25,
  sword: 15,
  axe: 10,
  archer: 10,
  spy: 0,
  light: 80,
  marcher: 50,
  heavy: 50,
  ram: 0,
  catapult: 0,
  knight: 100,
};
var unitSpeed = {
  spear: 18,
  sword: 22,
  axe: 18,
  archer: 18,
  spy: 9,
  light: 10,
  marcher: 10,
  heavy: 11,
  ram: 30,
  catapult: 30,
};

/* group units by similar speeds, for more organized attacks optimizing by speed */
var speedGroups = [
  ["spy", "light", "marcher", "heavy"],
  ["spear", "sword", "axe", "archer"],
  ["ram", "catapult"],
];
var slowestSpeedofGroups = [
  11,
  22,
  30,
];

/* list units, in addition to aliases (for parsing purposes) */
var troopList = ["spear", "sword", "axe", "archer", "spy", "light", "marcher", "heavy", "ram", "catapult", "knight"]; /*Ignore snob*/
var commonTroopNames = [
  ["spearman", "spear"],
  ["swordman", "sword"],
  ["axeman", "axe"],
  ["scout", "spy"],
  ["lc", "light"],
  ["light cavalry", "light"],
  ["ma", "marcher"],
  ["mounted archer", "marcher"],
  ["heavy cavalry", "heavy"],
  ["hc", "heavy"],
  ["cat", "catapult"],
  ["paladin", "knight"],
];

/* stats about rams & catapults */
var ramsRequired = [0, 2, 4, 7, 10, 14, 19, 24, 30, 37, 45, 55, 65, 77, 91, 106, 124, 143, 166, 191, 219]; /* to break a wall from level i to level 0 */
var ramsMin = [0, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 6, 6]; /* to break a wall from level i to level max(0, i-1) */

var catsRequiredToBreak = [
  /*[0,30] = from 30 to 0*/
  /*From:[0,1,2, 3, 4, 5, 6, 7, 8, 9,10,11,12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,  29,  30]*/
  /*To:*/
  /* 0*/ [0,2,6,10,15,21,28,36,45,56,68,82,98,115,136,159,185,215,248,286,328,376,430,490,558,634,720,815,922,1041,1175],
  /* 1*/ [0,0,2, 6,11,17,23,31,39,49,61,74,89,106,126,148,173,202,234,270,312,358,410,469,534,508,691,784,888,1005,1135],
  /* 2*/ [0,0,0, 2, 7,12,18,25,33,43,54,66,81, 97,116,137,161,189,220,255,295,340,390,447,511,583,663,754,855, 968,1095],
  /* 3*/ [0,0,0, 0, 3, 7,13,20,27,36,47,59,72, 88,106,126,149,176,206,240,278,321,370,425,487,557,635,723,821, 932,1055],
  /* 4*/ [0,0,0, 0, 0, 3, 8,14,21,30,40,51,64, 79, 96,115,137,163,192,224,261,303,350,403,463,531,607,692,788, 895,1015],
  /* 5*/ [0,0,0, 0, 0, 0, 3, 9,15,23,32,43,55, 69, 86,104,126,150,177,209,244,285,330,382,440,505,579,661,754, 859, 976],
  /* 6*/ [0,0,0, 0, 0, 0, 0, 3, 9,17,25,35,47, 60, 76, 93,114,137,163,193,227,266,310,360,416,479,550,631,721, 822, 936],
  /* 7*/ [0,0,0, 0, 0, 0, 0, 0, 3,10,18,28,38, 51, 66, 82,102,124,149,178,211,248,290,338,392,453,522,600,687, 786, 896],
  /* 8*/ [0,0,0, 0, 0, 0, 0, 0, 0, 4,11,20,30, 42, 56, 72, 90,111,135,162,194,230,270,316,368,427,494,569,654, 749, 856],
  /* 9*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 4,12,22, 33, 46, 61, 78, 98,121,147,177,211,250,294,345,401,466,538,620, 713, 816],
  /*10*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 4,13, 23, 36, 50, 66, 85,107,132,160,193,230,273,321,376,438,508,587, 676, 777],
  /*11*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 14, 26, 39, 54, 72, 92,116,143,175,210,251,297,350,409,477,553, 640, 737],
  /*12*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  5, 16, 28, 42, 59, 78,101,127,156,190,229,273,324,381,446,520, 603, 697],
  /*13*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  6, 17, 30, 46, 64, 85,110,138,170,207,250,298,353,415,486, 567, 657],
  /*14*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  6, 18, 33, 50, 70, 93,120,150,186,226,272,325,385,453, 530, 617],
  /*15*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  6, 20, 36, 54, 76,101,130,164,202,246,297,354,419, 493, 578],
  /*16*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  7, 22, 39, 59, 83,110,142,178,220,268,323,386, 457, 538],
  /*17*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0,  8, 24, 43, 65, 90,120,155,195,240,292,352, 420, 498],
  /*18*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0,  0,  8, 26, 46, 70, 98,131,169,212,262,319, 384, 458],
  /*19*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0,  0,  0,  9, 28, 50, 77,107,143,184,231,285, 347, 418],
  /*20*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0,  0,  0,  0, 10, 30, 55, 84,117,156,200,252, 311, 379],
  /*21*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 10, 33, 60, 91,127,170,218, 274, 339],
  /*22*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 11, 36, 65, 99,139,185, 238, 299],
  /*23*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 12, 39, 71,108,151, 201, 259],
  /*24*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 13, 43, 77,118, 165, 219],
  /*25*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 15, 47, 84, 128, 180],
  /*26*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 16, 51,  92, 140],
  /*27*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 17,  55, 100],
  /*28*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  19,  60],
  /*29*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,   0,  20],
  /*30*/ [0,0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,   0,   0]
];
var catsMin = [0,2,2,2,3,3,3,3,3,4,4,4,5,5,6,6,6,7,8,8,9,10,10,11,12,13,15,16,17,19,20]; /* to break a building from level i to level max(0, i-1) */

/* for date parsing */
var months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/* translations */
var _a = { /* translations */
  en : {
    Headquarters: "Headquarters",
    Barracks: "Barracks",
    Stable: "Stable",
    Workshop: "Workshop",
    Church: "Church",
    "First church": "First church",
    Academy: "Academy",
    Smithy: "Smithy",
    "Rally point": "Rally point",
    Statue: "Statue",
    Market: "Market",
    "Timber camp": "Timber camp",
    "Clay pit": "Clay pit",
    "Iron mine": "Iron mine",
    Farm: "Farm",
    Warehouse: "Warehouse",
    "Hiding place": "Hiding place",
    Wall: "Wall",
    "Please run this from the 'attacks' menu!": "Please run this from the 'attacks' menu on the reports page (not all)!",
    SAVED: "SAVED",
    Saved: "Saved",
    "NOT SAVED": "NOT SAVED (Village disabled?)",
    "Are you sure you've imported some reports?": "Are you sure you've imported some reports?",
    Changed: "Changed",
    "Attack on": "Attack on",
    "No villages left to attack! Either add more villages, or wait for the attacks to complete.": "No villages left to attack! Either add more villages, or wait for the attacks to complete.",
    "Add to farm list for ": "Add to farm list for ",
    "Enable farm for ": "Enable farm for ",
    "Disable farm for ": "Disable farm for ",
    Added: "Added",
    Enabled: "Enabled",
    Disabled: "Disabled",
    Level: "Level",
    jan: "Jan",
    feb: "Feb",
    mar: "Mar",
    apr: "Apr",
    may: "May",
    jun: "Jun",
    jul: "Jul",
    aug: "Aug",
    sep: "Sep",
    oct: "Oct",
    nov: "Nov",
    dec: "Dec",
    Coordinates: "Coordinates",
    Tribe: "Tribe",
    Actions: "Actions",
    Defender: "Defender",
  },
  no: {
    Headquarters: "Hovedkvarter",
    Barracks: "Brakker",
    Stable: "Stall",
    Workshop: "Verksted",
    Church: "Kirke",
    "First church": "Første Kirke",
    Academy: "Akademi",
    Smithy: "Smie",
    "Rally point": "Samlingsplass",
    Statue: "Statue",
    Market: "Marked",
    "Timber camp": "Hogstfelt",
    "Clay pit": "Leirgrav",
    "Iron mine": "Jerngruve",
    Farm: "Gård",
    Warehouse: "Varehus",
    "Hiding place": "Skjulested",
    Wall: "Mur",
    "Please run this from the 'attacks' menu!": "Vennligst kjør dette scrtiptet fra 'angrep' menyen på rapport siden (ikke alle).",
    SAVED: "LAGRET",
    Saved: "Lagret",
    "NOT SAVED": "IKKE LAGRET (Landsby deaktivert?)",
    "Are you sure you've imported some reports?": "Er du sikker på at du har importert rapporter?",
    Changed: "Endret",
    "Attack on": "Angrep på",
    "No villages left to attack! Either add more villages, or wait for the attacks to complete.": "Ingen flere byer igjen til å angripe! Vennligst legg til flere byer, eller vent til angrepene har truffet.",
    "Add to farm list for ": "Legg til i listen over farms for ",
    "Enable farm for ": "Aktiver farm for ",
    "Disable farm for ": "Deaktiver farm for ",
    Added: "Lagt til",
    Enabled: "Aktivert",
    Disabled: "Deaktivert",
    Level: "Nivå",
    jan: "Jan",
    feb: "Feb",
    mar: "Mar",
    apr: "Apr",
    may: "Mai",
    jun: "Juni",
    jul: "Juli",
    aug: "Aug",
    sep: "Sep",
    oct: "Okt",
    nov: "Nov",
    dec: "Des",
    Coordinates: "Koordinater",
    Tribe: "Stamme",
    Actions: "Handlinger",
    Defender: "Forsvarer",
  },
};

/*The two letter acronym (typically) for the world. e.g. en, zz, no, de.*/
var worldLetters = window.location.host.split('.')[0].substring(0, 2).replace(/\d/g, '');

var defaultNafsData = {
  villages: {},
  settings: {},
};

/* Cached settings retrieved from localStorage */
var settings;

/* Fetch local storage */
function getLocalStorage() {
  if (settings) return settings;

  if (!localStorage) {
    alert("Local storage isn't enabled. NAFS won't function without it!");
    throw new Error("LocalStorage is disabled.");
  }

  if (!localStorage.NAFSData) localStorage.NAFSData = JSON.stringify(defaultNafsData);

  settings = JSON.parse(localStorage.NAFSData);
  return settings;
}

/* Save local storage */
function setLocalStorage(data) {
  if (typeof data === "undefined") {
    data = settings;
  } else {
    settings = data;
  }
  localStorage.NAFSData = JSON.stringify(data);
}

function getSettings() {
  var nafsData = getLocalStorage();
  if (!nafsData.settings) nafsData.settings = JSON.parse(JSON.stringify(defaultNafsData.settings));
  return nafsData.settings;
}

function parseSettingForUse(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

/* Fetch a setting from the localStorage by key, with optional default */
function getSetting(settingKey, defaultValue) {
  var nafsData = getLocalStorage();
  if (nafsData.settings && nafsData.settings[settingKey]) {
    var settingValue = nafsData.settings[settingKey];
    return parseSettingForUse(settingValue);
  }
  return defaultValue;
}

/* Save a setting to the localStorage */
function setSetting(settingKey, value) {
  var nafsData = getLocalStorage();
  if (!nafsData.settings) nafsData.settings = JSON.parse(JSON.stringify(defaultNafsData.settings));

  value = parseSettingForUse(value);
  nafsData.settings[settingKey] = value;
  setLocalStorage(nafsData);

  return true;
}

/* Return the 'lang' setting, else default to the world letters if such a translation exists (else default to 'en') */
function getCurrentLang() {
  return getSetting("lang", (_a[worldLetters] && worldLetters) || "en");
}

/* Translation function, to return localized versions of strings
   Defaults to translateID, if no current-lang translation found
 */
function _(translateID){
  var translations = _a[getCurrentLang()];
  var translation = translations && translations[translateID];
  if (translation) return translation;
  return translateID;
}

/*HQ (1), Barracks (0), Stable (0), Workshop (0), Church (0), Academy (0), Smithy (0), Rally Point (0), Statue (0), Market (0), Timber Camp (leave), Clay Pit (leave), Iron Mine (leave), Farm (1), Warehouse (leave), Hiding Place (impossible), Wall (0)*/
var catables = [
  {name: _("Farm"), lowest: (getSetting("catFarmToZero", false) ? 1: 12), id: "farm"},
  {name: _("Headquarters"), lowest: 1, id: "main"},
  {name: _("Barracks"), lowest: 0, id: "barracks"},
  {name: _("Stable"), lowest: 0, id: "stable"},
  {name: _("Workshop"), lowest: 0, id: "garage"},
  {name: _("Academy"), lowest: 0, id: "snob"},
  {name: _("Smithy"), lowest: 0, id: "smith"},
  {name: _("Rally point"), lowest: 0, id: "place"},
  {name: _("Statue"), lowest: 0, id: "statue"},
  {name: _("Market"), lowest: 0, id: "market"}
];

var buildingList = ["barracks", "rally", "stable", "garage", "snob", "smith", "statue", "market", "main", "farm", "wall"];

function getQuery(name) {
  return getQueryFromHaystack(document.location, name);
}

function getQueryFromHaystack(haystack, name, baseURL = document.location) {
  if (!(haystack instanceof URL)) haystack = new URL(haystack, baseURL);
  return haystack.searchParams.get(name);
}

/* Cached world settings */
var worldSettings;

/* The worldSettings XML is set up in such a way that it looks JSONic, so convert it with heavy assumptions about its format */
function convertSettingsXMLToJson(item) {
  var potentialTextChild = item.childNodes.item(0);
  if (item.childNodes.length === 1 && potentialTextChild.nodeType === Node.TEXT_NODE) {
    return potentialTextChild.nodeValue;
  }

  var response = {};
  item.childNodes.forEach(function(element) {
    if (element.nodeType === Node.TEXT_NODE) return;
    response[element.nodeName] = convertSettingsXMLToJson(element);
  });
  return response;
}

function getWorldSettings() {
  if (worldSettings) return worldSettings;
  var httpRequest = new XMLHttpRequest();
  if (!httpRequest) {
    throw new Error("XMLHttpRequest couldn't be created.");
  }
  var worldSettingsURL = new URL("/interface.php?func=get_config", window.location);
  httpRequest.open("GET", worldSettingsURL.toString(), false);
  httpRequest.setRequestHeader('Content-Type', 'application/xml');
  httpRequest.send();
  var worldSettingsXML = httpRequest.responseXML;

  var root = worldSettingsXML.getElementsByTagName("config")[0];
  worldSettings = convertSettingsXMLToJson(root);

  return worldSettings;
}

function getWorldSpeed() {
  return parseFloat(getWorldSettings().speed);
}

function getUnitSpeed() {
  return parseFloat(getWorldSettings().unit_speed);
}

/* converts a pair of settings into an object, like such:
  - parseKeySettingPair("maxFarmTroops")
  with settings data:
    maxFarmTroops: "-1,-1,-1,-1,-1,0,0,0"
    maxFarmTroopsKey: "spear,sword,axe,archer,lc,ma,hc,paladin"
  returns:
    { spear: "-1", sword: "-1", axe: "-1", archer: "-1", scout: "-1", lc: "-1", ma: "0", hc: "0", paladin: "0" }
*/
function parseKeySettingPair(settingName) {
  var nafsSettings = getSettings();

  var settingValues = nafsSettings[settingValues];
  var settingKeys = nafsSettings[settingName + "Key"];
  if (!settingValues || !settingKeys) return;

  if (typeof settingKeys === "string") settingKeys = settingKeys.split(",");
  if (typeof settingValues === "string") settingValues = settingValues.split(",");

  var settingsObject = {};
  for (var i=0; i < settingKeys.length; i++) {
    var key = settingKeys[i];
    var value = settingValues[i];
    settingsObject[key] = value;
  }

  return settingsObject;
}

/* Same as parseKeySettingPair, but converts values to integers and uses fixTroopName on the keys. */
function parseKeySettingPairForTroops(settingName) {
  var settingMap = parseKeySettingPair(settingName);
  Object.keys(settingMap).forEach(function(key) {
    settingMap[key] = parseInt(settingMap[key], 10);
    var correctedKey = fixTroopName(key);
    if (correctedKey && correctedKey !== key) {
      settingMap[correctedKey] = settingMap[key];
      delete settingMap[key];
    }
  });
  return settingMap;
}

function getCoordStringFrom(str) {
  str = str.trim();

  var results = str.match(/\((\d{2,3}\|\d{2,3})\)/);
  if (!results) return;

  return results[1];
}

function getLocalName() {
  return $("#menu_row2 a.nowrap").text().trim();
}

function getLocalCoordString() {
  return getCoordStringFrom($("#menu_row2 b.nowrap").text());
}

function getLocalData() {
  var nafsData = getLocalStorage();
  var localCoordString = getLocalCoordString();
  var localData = nafsData.villages[localCoordString];
  return localData;
}

function clearDisabledFarms() {
  var nafsData = getLocalStorage();
  Object.keys(nafsData.villages).forEach(function(coords) {
    if (coords.indexOf("|") !== -1) clearDisabledFarmsFor(coords);
  });
}

function clearDisabledFarmsFor(coords) {
  var nafsData = getLocalStorage();

  var villageFarms = nafsData.villages[coords];
  var newVillageFarms = villageFarms.filter(function(villageFarm) { return !villageFarm.disabled; });
  nafsData.villages[coords] = newVillageFarms;

  setLocalStorage(nafsData);
}

var SettingTypes = {
  Integers: 1,
  Floats: 2,
  Booleans: 4,
};

function typeStringFor(allowedValues) {
  if (!allowedValues) return;
  var types = [];
  if (allowedValues & SettingTypes.Integers === SettingTypes.Integers) types.push('integer');
  if (allowedValues & SettingTypes.Floats === SettingTypes.Floats) types.push('number');
  if (allowedValues & SettingTypes.Booleans === SettingTypes.Booleans) types = types.concat(['yes', 'no']);
  return types.join('/');
}

function tryProcessSetting(value, allowedValues) {
  value = value.trim();
  if (!allowedValues) return value;
  var temp;
  if (allowedValues & SettingTypes.Integers === SettingTypes.Integers) {
    temp = parseInt(value, 10);
    if (Number.isInteger(temp)) return temp;
  }
  if (allowedValues & SettingTypes.Floats === SettingTypes.Floats) {
    temp = parseFloat(value, 10);
    if (Number.isFinite(temp)) return temp;
  }
  if (allowedValues & SettingTypes.Booleans === SettingTypes.Booleans) {
    if (['true', 'yes', 'y'].includes(value.toLowerCase())) return true;
    if (['false', 'no', 'n'].includes(value.toLowerCase())) return false;
  }
  return value;
}

function humanReadableSetting(value) {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return value.toString();
}

function promptForSettingChange(settingKey, description, defaultIfNotSet, allowedValues) {
  var oldValue = getSetting(settingKey, defaultIfNotSet);
  var newValue;

  var typeString = typeStringFor(allowedValues);
  var promptText = description + (typeString ? " (" + typeString + ")" : "");
  while (typeof newValue !== 'undefined') {
    prompt(promptText, humanReadableSetting(oldValue));

    if (newValue === null) {
      // Cancel was pressed. Change nothing.
      // TODO: make behavior more sensible
      return;
    }

    newValue = parseSettingForUse(newValue);
    if (!tryProcessSetting(newValue, allowedValues)) {
      newValue = undefined;
      alert("That value is not allowed for this setting! Please try again.");
    }
  }

  setSetting(settingKey, newValue);
}

function changeConfig() {
  /*
  Config Data:
  {rescout {minScout, hoursToRescout, hoursToStale}, farm {minFarmTroops (,), maxFarmTroops (,), leaveFarmTroops (,)}, shape {catapult {catFarmToZero}, [catapultWalls, ram] {minWallLevel}, minShapeTroops (,), maxShapeTroops (,), leaveShapeTroops (,)}, playerImport}
  */

  alert("We will now change the settings of this farming script! Please do not CANCEL, nor type in random stuff, as you will have to redo this!");

  promptForSettingChange("rescout", "Should we re-scout farms with old/stale reports? (If you disable this, automatic values will likely be wrong!)", true, SettingTypes.Booleans);

  if (getSetting("rescout")) {
    promptForSettingChange("minScout", "How many scouts to send at a minimum per attack?", 1, SettingTypes.Integers);

    promptForSettingChange("hoursToRescout", "How many hours until a report 'expires' and may no longer be used for data? You will want to adjust this based on the world speed.", 36, SettingTypes.Floats);

    promptForSettingChange("hoursToStale", "How many hours until a report becomes 'stale' and /may/ be rescouted? You will want to adjust this based on the world speed.", 10, SettingTypes.Floats);
  }

  promptForSettingChange("farm", "Should we farm villages?", true, SettingTypes.Booleans);

  if (getSetting("farm")) {
    promptForSettingChange("minFarmTroops", "If the troop is used, how many of each troop should be sent at a minimum per farming attack? (spear, sword, axe, archer, lc, ma, hc, paladin - separate by commas, no spaces)", "0,0,0,0,5,0,0,0");
    setSetting("minFarmTroopsKey", "spear,sword,axe,archer,lc,ma,hc,paladin");

    promptForSettingChange("maxFarmTroops", "If the troop is used, how many of each troop should be sent at a maximum per farming attack? (spear, sword, axe, archer, lc, ma, hc, paladin - separate by commas, no spaces; -1 means no limit, 0 disables the troop)", "0,0,0,0,-1,0,0,0");
    setSetting("maxFarmTroopsKey", "spear,sword,axe,archer,lc,ma,hc,paladin");

    promptForSettingChange("leaveFarmTroops", "How many troops to leave, at a minimum, within the village? (spear, sword, axe, archer, scout, lc, ma, hc, paladin - separate by commas, no spaces)", "0,0,0,0,0,0,0,0,0");
    setSetting("leaveFarmTroopsKey", "spear,sword,axe,archer,scout,lc,ma,hc,paladin");
  }

  promptForSettingChange("shape", "Should we knock down walls and/or shape villages?", true, SettingTypes.Booleans);

  if (getSetting("shape")) {
    promptForSettingChange("ram", "Should we use rams to knock down farm walls?", true, SettingTypes.Booleans);

    promptForSettingChange("catapult", "Should we use catapults to shape villages?", true, SettingTypes.Booleans);

    if (getSetting("catapult")) {
      promptForSettingChange("catFarmToZero", "Should we catapult farms to zero? (Otherwise about level 12.)", false, SettingTypes.Booleans);

      promptForSettingChange("catapultWalls", "Should we use catapults to knock down walls (after rams)?", true, SettingTypes.Booleans);
    }

    if (getSetting("catapultWalls") || getSetting("ram")) {
      promptForSettingChange("minWallLevel", "What should the minimum wall level required to send rams (or catapults, if applicable) be?", 1, SettingTypes.Integers);
    }
  }

  if (getSetting("shape") && (getSetting("catapult") || getSetting("ram"))){
    promptForSettingChange("minShapeTroops", "If the troop is used, how many of each should be sent at a minimum per shaping attack? (spear, sword, axe, archer, lc, ma, hc, ram, catapult, paladin - separate by commas, no spaces)", "50,50,50,50,0,0,0,2,2,0");
    setSetting("minShapeTroopsKey", "spear,sword,axe,archer,lc,ma,hc,ram,catapult,paladin");

    promptForSettingChange("maxShapeTroops", "If the troop is used, how many of each should be sent at a maximum per shaping attack? (spear, sword, axe, archer, lc, ma, hc, ram, catapult, paladin - separate by commas, no spaces; -1 means no limit, 0 disables the troop)", "100,100,100,100,0,0,0,-1,-1,0");
    setSetting("maxShapeTroopsKey", "spear,sword,axe,archer,lc,ma,hc,ram,catapult,paladin");

    promptForSettingChange("leaveShapeTroops", "How many troops to leave, at a minimum, within the village after shaping attacks? (spear, sword, axe, archer, scout, lc, ma, hc, ram, catapult, paladin - separate by commas, no spaces)", "50,50,50,50,5,0,0,0,0,0,0");
    setSetting("leaveShapeTroopsKey", "spear,sword,axe,archer,scout,lc,ma,ha,ram,catapult,paladin");
  }

  promptForSettingChange("playerImport", "Should we import reports with players as the defenders?", true, SettingTypes.Booleans);

  alert("The main configuration is now over.");

  if (prompt("This option isn't a configuration option. Would you like to clear your currently disabled villages from your list of farms? (true/false)", "false") === "true") clearDisabledFarms();
}

function addReport(reportID, attackingCoordsString, defendingCoordsString, wood, clay, iron, battleTime, buildingLevels) {
  if (typeof attackingCoordsString === "object") attackingCoordsString = attackingCoordsString.join("|");
  if (typeof defendingCoordsString === "object") defendingCoordsString = defendingCoordsString.join("|");

  var nafsData = getLocalStorage();
  if (!nafsData.villages) nafsData.villages = {};
  if (!nafsData.villages[attackingCoordsString]) nafsData.villages[attackingCoordsString] = [];

  var attackingVillageData = nafsData.villages[attackingCoordsString];

  var defendingVillage = attackingVillageData.find(function(element) { return element.coords === defendingCoordsString; });

  if (!defendingVillage) {
    var attackingCoords = attackingCoordsString.split("|").map(function(x) { return parseInt(x, 10); });
    var defendingCoords = defendingCoordsString.split("|").map(function(x) { return parseInt(x, 10); });
    var distance = Math.sqrt(
      Math.pow(defendingCoords[0] - attackingCoords[0], 2)
      + Math.pow(defendingCoords[1] - attackingCoords[1], 2)
    );
    defendingVillage = {
      coords: defendingCoordsString,
      disabled: false,
      distance: Math.floor(distance * 100.0)/100.0,
      reports: []
    };
    attackingVillageData.push(defendingVillage);
    attackingVillageData.sort(function(a, b){
      return a.distance - b.distance;
    });
  }

  if (defendingVillage.disabled) return "Disabled";

  buildingList.forEach(function(building) {
    if (typeof buildingLevels[building] === "undefined") buildingLevels[building] = 0;
  });

  battleTime = Number(battleTime);
  var report = defendingVillage.reports.find(function(element) {
    if (element.reportID === reportID) return true;
  });
  if (report) return "Report already imported.";

  defendingVillage.reports.push({
    reportID: reportID,
    battleTime: battleTime,
    wood: wood,
    clay: clay,
    iron: iron,
    buildings: buildingLevels
  });

  defendingVillage.reports.sort(function(a, b) {
    return b.battleTime - a.battleTime;
  });

  // To keep stuff up to date, remove old reports
  defendingVillage.reports = defendingVillage.reports.slice(0, 1);

  setLocalStorage(nafsData);
  return true;
}

function fixTroopName(troopName) {
  troopName = troopName.toLowerCase().trim();
  commonTroopNames.forEach(function(commonTroopNameSet) {
    var commonName = commonTroopNameSet[0];
    var properName = commonTroopNameSet[1];
    if (troopName.indexOf(commonName) !== -1) troopName = properName;
  });
  return troopName;
}

function getMaxTroops() {
  if (getQuery("screen") !== "place") {
    console.log("Wrong screen. Should be at rally point.");
    return "Wrong screen.";
  }

  var troopCounts = {};
  var troopCountMatcher = /\((\d+)\)/;
  troopList.forEach(function(troop) {
    var troopInput = $("#unit_input_" + troop);
    if (troopInput.length === 0) return;

    var parentText = troopInput.parent().text().trim();
    var result = parentText.match(troopCountMatcher);
    var count = result && result.length > 1 && result[1] && parseInt(result[1], 10);
    if (!result || !Number.isInteger(count)) {
      console.log("Something seems to be wrong with the max number of " + troop + ".");
    }

    troopCounts[troop] = count;
  });
  return troopCounts;
}

function getMaxTroop(troopName) {
  return getMaxTroops()[fixTroopName(troopName)];
}

function errorBox(msg) {
  if (getQuery("screen") === "place" && ($("#units_form").length > 0 || $("#command-data-form").length > 0)) {
    /*Regular rally page.*/
    var errorBo = $("#nafserror");
    if (errorBo.length === 0) {
      errorBo = $("<span id='nafserror'></span>").css({color: "#F00"});
      $($("#units_form table, #command-data-form table").get(0)).before(errorBo);
    }

    $("#nafserror").text($("#nafserror").text() + "\n" + msg);
  } else if (getQuery("screen") === "report" && !getQuery("view")) {
    var warning = $("#nafswarning");
    if (warning.length === 0) {
      warning = $("<span id='nafswarning'>").css({color: "#F00","font-weight":"bold"});
      $("#report_list").before(warning);
    }

    warning.text(msg);
  }
}

// in milliseconds
function getTimeSince(report) {
  return Number(new Date()) - report.battleTime;
}

function getLatestReportFor(village) {
  return village.reports && village.reports[0];
}

function insertTroops(troops) {
  $("[id*='unit_input_']").val(""); // empty inputs
  troops.forEach(function(troop) {
    var troopName = fixTroopName(troop);
    $("#unit_input_" + troopName).val(troops[troop]);
  });
}

function targetVil(vilCoords) {
  vilCoords = vilCoords.match(/(\d{2,3})\|(\d{2,3})/);
  $("#inputx").val(vilCoords[1]);
  $("#inputy").val(vilCoords[2]);
  $("#unit_input_spear").focus();
}

function processReportsPage() {
  var nafsData = getLocalStorage();

  if (getQuery("view")) {
    /*We're on an individual report!*/
    var reportID = getQuery("view");
    processReport(document, reportID);
  } else if (getQuery("mode") === "all" || !getQuery("mode")) {
    errorBox(_("Please run this from the 'attacks' menu!"));
  } else if (getQuery("mode") === "attack") {
    /* Report: Attack menu */
    $("#report_list .quickedit-content").each(function(index) {
      var reportURL = $("a", this);
      if (reportURL.length < 1) {
        /*This report has no URL. Woo?*/
        this.innerHTML += " - no report URL";
        return;
      }

      reportURL = reportURL.attr("href");
      var reportElement = this;

      jQuery.ajax(reportURL, {
        type: "GET",
        dataType: "html",
        async: true,
        error: function(jqXHR, textStatus, errorThrown) {
          reportElement.innerHTML += " - " + _("report failed to load (see console for more info)");
          console.log("Report failed to load via AJAX. Status: " + textStatus + "; error: " + errorThrown);
        },
        success: function(responseData) {
          var fakeDOM = $("<div class='NAFSReportDOM'></div>");
          fakeDOM.html(responseData);

          var reportID = getQueryFromHaystack(reportURL, "view");
          var reportProgressed = processReport(fakeDOM, reportID);

          fakeDOM.html("");

          if (reportProgressed === true) {
            reportElement.innerHTML += " - " + _("Saved");

            var reportCheckbox = $("input[type='checkbox']", $(reportElement).parents("#report_list tr"));
            if (reportCheckbox.length === 1) {
              reportCheckbox.prop("checked", true);
              return;
            }
            console.log("Couldn't check box of element:", index);
          }
          reportElement.innerHTML += " - " + reportProgressed;
        }
      });
    });
  }

  setLocalStorage(nafsData);
}

function processRallyConfirmationPage() {
  var nafsData = getLocalStorage();
  var localCoordString = getLocalCoordString();
  var localData = nafsData.villages[localCoordString];

  var targetCoordString = getCoordStringFrom($(".village_anchor").text());
  var targetVillage = localData.find(function(element) {
    return element.coords === targetCoordString;
  });

  if (!targetVillage) {
    errorBox(_("Are you sure this village is in the NAFS list?"));
    $("#troop_confirm_go").focus();
    return;
  }

  var latestReport = targetVillage && targetVillage.reports && targetVillage.reports[0];
  var buildingSelect = $("select[name='building']");
  if (buildingSelect.length > 0 && latestReport && latestReport.buildings) {
    var catTarget = catables.find(function(element) {
      return latestReport.buildings[element.id] && latestReport.buildings[element.id] > element.lowest;
    });
    if (catTarget) {
      var nafsMsg = $("#nafsMsg");
      if (nafsMsg.length === 0) {
        nafsMsg = $("<span id='nafsMsg' style='color:#0A0;'>" + _("Changed") + "</span>");
      }
      buildingSelect.val(catTarget.id);
      buildingSelect.after(nafsMsg);
    }
  }
  $("#troop_confirm_go").focus();
}

function tryKnockingDownWalls(village) {
  var minScout = getSetting("minScout", 1);
  var catapultWalls = getSetting("catapultWalls", true);
  var ramWalls = getSetting("ram", true);
  var minWallLevel = getSetting("minWallLevel", 1);
  var minShapeTroops = parseKeySettingPairForTroops("minShapeTroops");
  var maxShapeTroops = parseKeySettingPairForTroops("maxShapeTroops");
  var leaveShapeTroops = parseKeySettingPairForTroops("leaveShapeTroops");

  var latestReport = getLatestReportFor(village);
  var wallLevel = latestReport.buildings.wall;
  var wallShaping = ramWalls || catapultWalls;
  var wallNeedsShaping = wallLevel && wallLevel >= minWallLevel;
  if (!wallShaping) return;
  if (!wallNeedsShaping) return;

  var troops = {spy: minScout};

  /* Find a troop type, looking for the slowest first (since rams limit our speed) */
  var troopFound = false;
  speedGroups.reverse().forEach(function(speedGroup) {
    if (troopFound) return false;
    speedGroup.forEach(function(unit) {
      unit = fixTroopName(unit);
      var availableTroops = getMaxTroop(unit) - leaveShapeTroops[unit];
      if (maxShapeTroops[unit] !== -1) availableTroops = Math.min(availableTroops, maxShapeTroops[unit]);

      if (availableTroops >= minShapeTroops[unit] && availableTroops > 0) {
        troopFound = true;
        troops[unit] = availableTroops;
        return false;
      }
    });
  });

  if (!troopFound) return;

  var availableRams = getMaxTroop("ram") - leaveShapeTroops.ram;

  if (ramWalls && availableRams >= Math.max(minShapeTroops.ram, ramsMin[wallLevel])) {
    /*Ram walls, and we have enough to fulfill the min criteria (user-set and to take a wall)*/
    var ramCount = Math.min(availableRams, ramsRequired[wallLevel]);
    if (maxShapeTroops.ram !== -1) ramCount = Math.min(ramCount, maxShapeTroops.ram);

    if (ramCount >= Math.max(ramsMin[wallLevel], minShapeTroops.ram) && ramCount > 0) {
      /*Enough for minimum. Enough for leaving. Under the max. Ready to ram with these rams.*/

      /* TODO: use catapults to supplement rams: if (ramCount < ramsRequired[wallLevel]) */

      troops.ram = ramCount;

      console.log("Ram wall shaping! Village:", village.coords);

      return troops;
    }
  }

  if (catapultWalls && getMaxTroop("catapult") - leaveShapeTroops.catapult >= minShapeTroops.catapult && getMaxTroop("catapult") - leaveShapeTroops.catapult >= catsMin[wallLevel]) {
    var catCount = Math.min(catsRequiredToBreak[0][wallLevel], getMaxTroop("catapult") - leaveShapeTroops.catapult, maxShapeTroops.catapult === -1 ? getMaxTroop("catapult") : maxShapeTroops.catapult);
    if (catCount >= catsMin[wallLevel] && catCount >= minShapeTroops.catapult && catCount > 0) {
      /*Enough for minimum. Enough for leaving. Under the max. Ready to ram with these rams.*/
      /*For now we'll just deal with cats and rams separately, m'kay? Rams take priority.*/

      troops.catapult = catCount;

      console.log("Catapult wall shaping! Village " + village.coords);

      return troops;
    }
  }
}

function tryShapeVillage(village) {
  var minScout = getSetting("minScout", 1);
  var troops = { spy: minScout };

  var shape = getSetting("shape", true);

  var rescout = getSetting("rescout", true);
  var latestReport = getLatestReportFor(village);
  var timeSinceLastReport = getTimeSince(latestReport);
  var hoursToRescout = getSetting("hoursToRescout", 36);
  var needsRescout = rescout && timeSinceLastReport > (hoursToRescout * 60 * 60 * 1000);
  var leaveShapeTroops = parseKeySettingPairForTroops("leaveShapeTroops");
  var catapult = getSetting("catapult", true);
  var minShapeTroops = parseKeySettingPairForTroops("minShapeTroops");
  var maxShapeTroops = parseKeySettingPairForTroops("maxShapeTroops");

  /*Shaping is allowed, we have building data, and either we're not rescouting or it's under the hours to rescout value.*/
  if (!shape || !latestReport.buildings || needsRescout || getMaxTroop("spy") <= leaveShapeTroops.spy) return;

  troops = tryKnockingDownWalls();
  if (troops) return troops;

  var minimumAchieved = false;
  troops = {spy: minScout};
  if (catapult) {
    for (var speedGroupID = speedGroups.length-1; speedGroupID>=0; speedGroupID--) {
      /*Group 0 is the fasters, therefore this goes slowest first.*/
      for (var unitID in speedGroups[speedGroupID]){
        if (minimumAchieved) break;

        var unit = speedGroups[speedGroupID][unitID];
        var troopCount = Math.min(getMaxTroop(unit) - leaveShapeTroops[unit], maxShapeTroops[unit] === -1 ? getMaxTroop(unit) : maxShapeTroops[unit]);
        if (troopCount >= minShapeTroops[unit] && troopCount > 0) {
          minimumAchieved = true;
          troops[unit] = troopCount;
        }
      }
    }

    if (minimumAchieved) {
      var catTarget;
      var catTargetLevel;
      var catTargetMin;
      catables.forEach(function(element) {
        if (catTarget) return false;
        if (latestReport.buildings[element.id] && latestReport.buildings[element.id] > element.lowest) {
          catTarget = element.id;
          catTargetLevel = latestReport.buildings[element.id];
          catTargetMin = element.lowest;
        }
      });

      /*catapultWalls && getMaxTroop("catapult") - leaveShapeTroops.catapult >= minShapeTroops.catapult && getMaxTroop("catapult") - leaveShapeTroops.catapult >= catsMin[wallLevel]) {
      var catCount = Math.min(catsRequiredToBreak[0][wallLevel], getMaxTroop("catapult") - leaveShapeTroops.catapult, maxShapeTroops.catapult === -1 ? getMaxTroop("catapult") : maxShapeTroops.catapult);
      if (catCount >= catsMin[wallLevel] && catCount >= minShapeTroops.catapult) {*/
      if (getMaxTroop("catapult") - leaveShapeTroops.catapult >= minShapeTroops.catapult && getMaxTroop("catapult") - leaveShapeTroops.catapult >= catsMin[catTargetLevel]) {
        var catCount = Math.min(catsRequiredToBreak[catTargetMin][catTargetLevel], getMaxTroop("catapult") - leaveShapeTroops.catapult, maxShapeTroops.catapult === -1 ? getMaxTroops("catapult") : maxShapeTroops.catapult);
        if (catCount >= catsMin[catTargetLevel] && catCount >= minShapeTroops.catapult && catCount > 0) {
          troops.catapult = catCount;

          console.log("Catapult shaping! Village " + village.coords);
          return troops;
        }
      }
    }
  }
}

function tryFarmVillage(village) {
  var farm = getSetting("farm", true);
  if (!farm) return;

  var minScout = getSetting("minScout", 1);
  var troops = {spy: minScout};

  var rescout = getSetting("rescout", true);
  var latestReport = getLatestReportFor(village);
  var timeSinceLastReport = getTimeSince(latestReport);
  var hoursToRescout = getSetting("hoursToRescout", 36);
  var needsRescout = rescout && timeSinceLastReport > (hoursToRescout * 60 * 60 * 1000);
  var leaveFarmTroops = parseKeySettingPairForTroops("leaveFarmTroops");
  var minFarmTroops = parseKeySettingPairForTroops("minFarmTroops");
  var maxFarmTroops = parseKeySettingPairForTroops("maxFarmTroops");

  if (farm && !needsRescout && getMaxTroop("spy") > minScout) {
    var hoursAgo = (Number(new Date()) - latestReport.battleTime) / 60 / 60 / 1000;
    var origWood = latestReport.wood,
        origClay = latestReport.clay,
        origIron = latestReport.iron;
    var woodCamp = latestReport.buildings.woodcamp,
        clayCamp = latestReport.buildings.claycamp,
        ironCamp = latestReport.buildings.ironcamp,
        warehouse = latestReport.buildings.warehouse;
    var currWood = Math.min(origWood + (resourceRates[woodCamp] * hoursAgo * getWorldSpeed()), warehouseCapacity[warehouse]),
        currClay = Math.min(origClay + (resourceRates[clayCamp] * hoursAgo * getWorldSpeed()), warehouseCapacity[warehouse]),
        currIron = Math.min(origIron + (resourceRates[ironCamp] * hoursAgo * getWorldSpeed()), warehouseCapacity[warehouse]);

    var distance = village.distance;

    var sendingTroops = false;
    for (var speedGroupID = 0; speedGroupID<speedGroups.length; speedGroupID++) {
      /*Group 0 is the fasters, therefore this goes fastest first.*/
      var slowestSpeedofGroup = slowestSpeedofGroups[speedGroupID];
      var hours = distance * (slowestSpeedofGroup / getUnitSpeed()) / 60;
      var newWood = currWood + (resourceRates[woodCamp] * hours * getWorldSpeed()),
          newClay = currClay + (resourceRates[clayCamp] * hours * getWorldSpeed()),
          newIron = currIron + (resourceRates[ironCamp] * hours * getWorldSpeed());
      var possibleHaul = newWood + newClay + newIron;
      for (var unitID in speedGroups[speedGroupID]){
        var unit = speedGroups[speedGroupID][unitID];
        var troopCount = Math.min(getMaxTroop(unit) - leaveFarmTroops[unit], maxFarmTroops[unit] === -1 ? getMaxTroop(unit) : maxFarmTroops[unit], Math.ceil(possibleHaul / unitCarry[unit]));
        if (troopCount >= minFarmTroops[unit] && troopCount > 0) {
          possibleHaul -= unitCarry[unit] * troopCount;
          sendingTroops = true;
          troops[unit] = troopCount;
        }
      }
      if (sendingTroops) break;
    }

    if (sendingTroops) {
      console.log("Farming! Village " + village.coords);

      return troops;
    }
  }
}

function tryScoutVillage(village) {
  var rescout = getSetting("rescout", true);
  if (!rescout) return;

  var minScout = getSetting("minScout", 1);
  var troops = {spy: minScout};

  var hoursToStale = getSetting("hoursToStale", 12);
  var latestReport = getLatestReportFor(village);
  var timeSinceLastReport = getTimeSince(latestReport);
  var leaveFarmTroops = parseKeySettingPairForTroops("leaveFarmTroops");
  var isStale = timeSinceLastReport > (hoursToStale * 60 * 60 * 1000);
  if (isStale && getMaxTroop("spy") > leaveFarmTroops.spy) {
    /*It's time to rescout. We also have at least 1 scout "available".*/
    console.log("Rescouting! Village " + village.coords);
    return troops;
  }
}

function tryAttackingVillages() {
  var localData = getLocalData();

  /*
  var rescout = getSetting("rescout", true);
  var minScout = getSetting("minScout", 1);
  var hoursToRescout = getSetting("hoursToRescout", 36);
  var hoursToStale = getSetting("hoursToStale", 12);

  var farm = getSetting("farm", true);
  var minFarmTroops = parseKeySettingPairForTroops("minFarmTroops");
  var maxFarmTroops = parseKeySettingPairForTroops("maxFarmTroops");
  var leaveFarmTroops = parseKeySettingPairForTroops("leaveFarmTroops");

  var shape = getSetting("shape", true);
  var catapult = getSetting("catapult", true);
  var catFarmToZero = getSetting("catFarmToZero", false);
  var catapultWalls = getSetting("catapultWalls", true);
  var ramWalls = getSetting("ram", true);
  var minWallLevel = getSetting("minWallLevel", 1);
  var minShapeTroops = parseKeySettingPairForTroops("minShapeTroops");
  var maxShapeTroops = parseKeySettingPairForTroops("maxShapeTroops");
  var leaveShapeTroops = parseKeySettingPairForTroops("leaveShapeTroops");
  */

  var troops;

  var attackedVillage = localData.find(function(village) {
    if (village.disabled) return;

    var latestReport = village.reports && village.reports[0];
    if (!latestReport) return;

    var extantAttack = $("#commands_outgoings .quickedit-content").find(function() {
      var text = $(this).text();
      if (!text.includes(_("Attack on"))) return;
      return getCoordStringFrom(text) === village.coords;
    });
    if (extantAttack) return;

    // shaping
    troops = tryShapeVillage();
    if (troops) return true;

    // farming
    troops = tryFarmVillage();
    if (troops) return true;

    return tryScoutVillage();
  });

  if (attackedVillage) {
    insertTroops(troops);
    targetVil(attackedVillage.coords);
  }

  return attackedVillage;
}

function processRallyPointPage() {
  var nafsData = getLocalStorage();
  var localCoordString = getLocalCoordString();
  var localData = nafsData.villages[localCoordString];

  if (!localData) {
    errorBox(_("Are you sure you've imported some reports?"));
    return;
  }

  if ($("#units_form").length === 0 && $("#command-data-form").length === 0) {
    /* Rally confirmation page. */
    processRallyConfirmationPage();
    return;
  }

  /* Not on the confirmation page. */
  var errorBo = $(".error_box");
  if (errorBo.length > 0) {
    var errorText = errorBo.text().trim();
    if (errorText.includes("can only attack each other when the bigger player's") || errorText.includes("has been banned and cannot be attacked")) {
      var vilCoords = $(".village-name");
      var coordsFound = false;
      if (vilCoords.length > 0) {
        vilCoords = getCoordStringFrom(vilCoords.text());
        if (vilCoords) {
          var village = localData.find(function(element) { return element.coords === vilCoords; });
          if (village) {
            coordsFound = true;
            village.disabled = true;
            $(".error_box").html("Previous farm disabled. Please <a href='" + window.location.href.replace(/[?&]try=confirm/, "") .replace(/[?&]target=\d+/, "") + "'>reopen the rally point</a>)");
          }
        }
      }
      if (!coordsFound) {
        errorBox("Unable to disable village. Is it in the NAFS list?");
      }
    }
    setLocalStorage(nafsData);
  }

  var attackedVillage = tryAttackingVillages();

  if (!attackedVillage) {
    errorBox(_("No villages left to attack! Either add more villages, or wait for the attacks to complete."));
  }
}

function showControlsOnVillagePage() {
  var localData = getLocalData();
  /* TODO: Apparently this needs to be fixed? */
  var vilTable = $("#content_value table table[width='100%']");
  var vilCoords = $("tr:contains('" + _("Coordinates") + "')", vilTable).text().split(":")[1];
  var tribe = $("tr:contains('" + _("Tribe") + "')", vilTable);

  var village = localData.find(function(element) {
    return element.coords === vilCoords;
  });
  var clickText = "";
  var type = -2;
  var types = {
    ADD_FARM: -1,
    ENABLE_FARM: 1,
    DISABLE_FARM: 0,
  };
  if (typeof village === "undefined"){
    clickText = _("Add to farm list for ") + getLocalName();
    type = types.ADD_FARM;
  } else if (village.disabled){
    clickText = _("Enable farm for ") + getLocalName();
    type = types.ENABLE_FARM;
  } else {
    clickText = _("Disable farm for ") + getLocalName();
    type = types.DISABLE_FARM;
  }
  var thingy = $("<tr><td colspan='2'></td></tr>");
  var thingy2 = $("<tr><td colspan='2'></td></tr>").css("display", "none");
  $("td", thingy).append($("<a style='cursor:pointer;'>» " + clickText + "</a>").on("click", function() {
    var nafsData = getLocalStorage();
    if (type === types.ADD_FARM) {
      throw new Error("Adding a farm needs centralizing.");
      localData.push({
        coords: (vilCoords[0] + "|" + vilCoords[1]),
        disabled: false,
        distance: (Math.floor(Math.sqrt(Math.pow(vilCoords[0]-localCoords[0],2)+Math.pow(vilCoords[1]-localCoords[1],2))*100)/100),
        reports: []
      });
      localData.sort(function(a, b){
        return a.distance - b.distance;
      });
      $("td", thingy2).text(_("Added"));
    } else if (type === types.DISABLE_FARM){
      village.disabled = true;
      $("td", thingy2).text(_("Disabled"));
    } else {
      village.disabled = false;
      $("td", thingy2).text(_("Enabled"));
    }
    setLocalStorage(nafsData);
    thingy.css("display", "none");
    thingy2.css("display", "");
  }));
  ($("tr:contains('" + _("Actions") + "')", vilTable).length > 0 ? $("tr:contains('" + _("Actions") + "')", vilTable) : tribe).after(thingy).after(thingy2);
}

function def() {
  if (getQuery("screen") === "report") {
    processReportsPage();
    return;
  }

  var nafsData = getLocalStorage();

  if (getQuery("screen") === "place") {
    processRallyPointPage();
  } else if (getQuery("screen") === "info_village") {
    showControlsOnVillagePage();
  }
  setLocalStorage(nafsData);
}

/* Returns either a boolean (indicating whether it succeeded), or a string message of what went wrong. */
function processReport(doc, reportID) {
  /* We're on *a* report screen. */
  var espionage = $("#attack_spy_resources, #attack_spy_buildings_left", doc);
  if (espionage.length >= 1) {
    /* NEW REPORT STYLE */
    var repTable = espionage.closest("tbody");
    var defender = $("#attack_info_def th:not(:contains('" + _("Defender") + "'))", repTable);
    if (!getSetting("playerImport", true) && defender.length >= 1 && !defender.text().match("---")) {
      var linkd = $("<span>" + _("Saved") + "</span>");
      repTable.parent().before(linkd);
      linkd.text("Defender seems to be a player, and config says not to import - not saved");
      return "The defender appears to be a player.";
    }

    var attackerVillage = $("#attack_info_att th:not(:contains('" + _("Attacker") + "'))", repTable).closest("tbody").find("tr:contains('Origin') td:not(:contains('Origin'))");
    var localCoords = getCoordStringFrom(attackerVillage.text()).split("|");

    var defenderVillage = $("#attack_info_def th:not(:contains('" + _("Defender") + "'))", repTable).closest("tbody").find("tr:contains('Destination') td:not(:contains('Destination'))");
    var vilCoords = getCoordStringFrom(defenderVillage.text()).split("|");

    var resources = $("#attack_spy_resources td", repTable);
    var resz = resources.text().trim().split(/\s+/);
    if (resources.get(0).innerHTML.indexOf("wood") === -1){
      resz.unshift("0");
    }
    if (resources.get(0).innerHTML.indexOf("stone") === -1){
      if (resz[1]) { resz.push(resz[1]); resz[1] = "0"; }
      else resz.push("0");
    }
    if (resources.get(0).innerHTML.indexOf("iron") === -1){
      resz.push("0");
    }
    var wood = parseInt(resz[0].replace(".", "")),
        clay = parseInt(resz[1].replace(".", "")),
        iron = parseInt(resz[2].replace(".", ""));
    var timezone = serverTimezones[window.location.host.split(/\W+/)[0].substring(0, 2)];
    var battleTimeText = $($("tr td", repTable).get(1)).text().trim().replace(/:\d{3}/, "") + (timezone ? ` ${timezone}` : '');
    /* Format: MMM(M?) D(D), YYYY HH:mm:ss:mmm GMT+HHmm */
    var timeThings = battleTimeText.match(/[\w-+]+/g);
    var month = 0;
    for (var i=0; i<months.length; i++){
      if (timeThings[0].match(new RegExp(_(months[i]),"i"))) {
        month = i+1;
      }
    }
    var date = parseInt(timeThings[1]);
    var year = parseInt(timeThings[2]);
    var hour = parseInt(timeThings[3]);
    var minute = parseInt(timeThings[4]);
    var second = parseInt(timeThings[5]);
    var offsets = timeThings[6].replace("GMT", "");
    var offsetz = [];
    offsetz[0] = offsets.substring(0, 1);
    offsetz[1] = offsets.substring(1, 3);
    offsetz[2] = offsets.substring(3, 5);
    var offset = ((offsetz[0] === "+") ? -1 : 1) * (parseInt(offsetz[1])*60 + parseInt(offsetz[2]));
    minute += offset;

    var day = new Date();
    day.setUTCFullYear(year);
    day.setUTCMonth(month-1);
    day.setUTCDate(date);
    day.setUTCHours(hour);
    day.setUTCMinutes(minute);
    day.setUTCSeconds(second);

    var battleTime = day;
    var buildings;
    var woodCamp, clayCamp, ironCamp, warehouse;
    if ($("#attack_spy_building_data", repTable).length >= 1){
      buildings = JSON.parse($("#attack_spy_building_data", repTable).val());
      buildings.forEach(function(element, index, array){
        if (element.id === "wood") woodCamp = parseInt(element.level);
        if (element.id === "stone") clayCamp = parseInt(element.level);
        if (element.id === "iron") ironCamp = parseInt(element.level);
        if (element.id === "storage") warehouse = parseInt(element.level);
        if (element.id === "wall") wall = parseInt(element.level);
      });
      woodCamp = (isNaN(woodCamp)) ? 0 : woodCamp;
      clayCamp = (isNaN(clayCamp)) ? 0 : clayCamp;
      ironCamp = (isNaN(ironCamp)) ? 0 : ironCamp;
      warehouse = (isNaN(warehouse)) ? 0 : warehouse;
      wall = (isNaN(wall)) ? 0 : wall;
    } else {
      woodCamp = 5;
      clayCamp = 5;
      ironCamp = 5;
      warehouse = 10;
      wall = 0;
    }
    var buildz = {};
    buildz.woodcamp = woodCamp;
    buildz.claycamp = clayCamp;
    buildz.ironcamp = ironCamp;
    buildz.warehouse = warehouse;
    buildz.wall = wall;

    if (buildings) {
      buildings.forEach(function(element, index, array){
        buildz[element.id] = parseInt(element.level);
      });
    }

    buildz.barracks = buildz.barracks || 0;
    buildz.place = buildz.place || 0;
    buildz.stable = buildz.stable || 0;
    buildz.garage = buildz.garage || 0;
    buildz.snob = buildz.snob || 0;
    buildz.smith = buildz.smith || 0;
    buildz.statue = buildz.statue || 0;
    buildz.market = buildz.market || 0;
    buildz.main = buildz.main || 0;
    buildz.farm = buildz.farm || 0;

    var linkd = $("<span>" + _("Saved") + "</span>");
    linkd.css("display", "none");

    repTable.parent().before(linkd);
    var progress = addReport(parseInt(reportID), localCoords, vilCoords, wood, clay, iron, battleTime, buildz);
    if (progress === true){
      linkd.text(_("Saved"));
      linkd.css("display", "block").css("color", "");
      console.log("Saved a report! - " + localCoords[0] + "|" + localCoords[1] + " - " + vilCoords[0] + "|" + vilCoords[1] + " - " + parseInt(reportID));
      return true;
    } else {
      linkd.text("Oops! There was an error.");
      linkd.css("display", "block").css("color", "#F00");
      console.log("Error with a report! - " + localCoords[0] + "|" + localCoords[1] + " - " + vilCoords[0] + "|" + vilCoords[1] + " - " + parseInt(reportID));
      return progress;
    }
  } else if ($("#attack_spy", doc).length >= 1) {
    /*OLD STYLE *BLERGH* */
    var espionage = $("#attack_spy", doc);
    var repTable = espionage.parent().parent().parent();
    var defender = $("#attack_info_def th:not(:contains('" + _("Defender") + "'))", repTable);
    if (!getSetting("playerimport", true) && defender.length >= 1 && !defender.text().match("---")){
      var linkd = $("<span>" + _("Saved") + "</span>");
      repTable.parent().before(linkd);
      linkd.text("Defender seems to be a player, and config says not to import - not saved");
      return "The defender appears to be a player.";
    }

    var attackerVillage = $("#attack_info_att th:not(:contains('" + _("Attacker") + "'))", repTable).closest("tbody").find("tr:contains('Origin') td:not(:contains('Origin'))");
    var localCoords = getCoordStringFrom(attackerVillage.text()).split("|");

    var defenderVillage = $("#attack_info_def th:not(:contains('" + _("Defender") + "'))", repTable).closest("tbody").find("tr:contains('Destination') td:not(:contains('Destination'))");
    var vilCoords = getCoordStringFrom(defenderVillage.text()).split("|");

    var resources = $($("tr td", espionage).get(0));
    var resz = resources.text().trim().split("  ");
    if (resources.get(0).innerHTML.indexOf("wood") === -1){
      resz.unshift("0");
    }
    if (resources.get(0).innerHTML.indexOf("stone") === -1){
      if (resz[1]) { resz.push(resz[1]); resz[1] = "0"; }
      else resz.push("0");
    }
    if (resources.get(0).innerHTML.indexOf("iron") === -1){
      resz.push("0");
    }
    var wood = parseInt(resz[0].replace(".", "")),
        clay = parseInt(resz[1].replace(".", "")),
        iron = parseInt(resz[2].replace(".", ""));
    var timezone = serverTimezones[window.location.host.split(/\W+/)[0].substring(0, 2)];
    var battleTimeText = $($("tr td", repTable).get(1)).text().trim().replace(/:\d{3}/, "") + (timezone ? ` ${timezone}` : '');
    /* Format: MMM(M?) D(D), YYYY HH:mm:ss:mmm GMT+HHmm */
    var timeThings = battleTimeText.match(/[\w-+]+/g);
    var month = 0;
    for (var i=0; i<months.length; i++){
      if (timeThings[0].match(new RegExp(_(months[i]),"i"))) {
        month = i+1;
      }
    }
    var date = parseInt(timeThings[1]);
    var year = parseInt(timeThings[2]);
    var hour = parseInt(timeThings[3]);
    var minute = parseInt(timeThings[4]);
    var second = parseInt(timeThings[5]);
    var offsets = timeThings[6].replace("GMT", "");
    var offsetz = [];
    offsetz[0] = offsets.substring(0, 1);
    offsetz[1] = offsets.substring(1, 3);
    offsetz[2] = offsets.substring(3, 5);
    var offset = ((offsetz[0] === "+") ? -1 : 1) * (parseInt(offsetz[1])*60 + parseInt(offsetz[2]));
    minute += offset;

    var day = new Date();
    day.setUTCFullYear(year);
    day.setUTCMonth(month-1);
    day.setUTCDate(date);
    day.setUTCHours(hour);
    day.setUTCMinutes(minute);
    day.setUTCSeconds(second);

    var battleTime = day;
    var buildings;
    var woodCamp, clayCamp, ironCamp, warehouse, wall;
    if ($("tr", espionage).length >= 2){
      buildings = espionage.text();
      woodCamp = parseInt(buildings.replace(new RegExp("[\\s\\S]*" + _("Timber camp") + " \\(" + _("Level") + " "), "").replace(/\)[\s\S]*/, ""));
      clayCamp = parseInt(buildings.replace(new RegExp("[\\s\\S]*" + _("Clay pit") + " \\(" + _("Level") + " "), "").replace(/\)[\s\S]*/, ""));
      ironCamp = parseInt(buildings.replace(new RegExp("[\\s\\S]*" + _("Iron mine") + " \\(" + _("Level") + " "), "").replace(/\)[\s\S]*/, ""));
      warehouse = parseInt(buildings.replace(new RegExp("[\\s\\S]*" + _("Warehouse") + " \\(" + _("Level") + " "), "").replace(/\)[\s\S]*/, ""));
      wall = parseInt(buildings.replace(new RegExp("[\\s\\S]*" + _("Wall") + " \\(" + _("Level") + " "), "").replace(/\)[\s\S]*/, ""));
      woodCamp = (isNaN(woodCamp)) ? 0 : woodCamp;
      clayCamp = (isNaN(clayCamp)) ? 0 : clayCamp;
      ironCamp = (isNaN(ironCamp)) ? 0 : ironCamp;
      warehouse = (isNaN(warehouse)) ? 0 : warehouse;
      wall = (isNaN(wall)) ? 0 : wall;
    } else {
      var woodCamp = 5,
          clayCamp = 5,
          ironCamp = 5,
          warehouse = 10,
          wall = 0;
    }
    var buildz = {};
    buildz.woodcamp = woodCamp;
    buildz.claycamp = clayCamp;
    buildz.ironcamp = ironCamp;
    buildz.warehouse = warehouse;
    buildz.wall = wall;
    /*CHURCH*/
    buildz.barracks = buildings && parseInt(buildings.replace(new RegExp("[\\s\\S]*" + _("Barracks") + " \\(" + _("Level") + " "), "").replace(/\)[\s\S]*/, "")) || 0;
    buildz.place = buildings && parseInt(buildings.replace(new RegExp("[\\s\\S]*" + _("Rally point") + " \\(" + _("Level") + " "), "").replace(/\)[\s\S]*/, "")) || 0;
    buildz.stable = buildings && parseInt(buildings.replace(new RegExp("[\\s\\S]*" + _("Stable") + " \\(" + _("Level") + " "), "").replace(/\)[\s\S]*/, "")) || 0;
    buildz.garage = buildings && parseInt(buildings.replace(new RegExp("[\\s\\S]*" + _("Workshop") + " \\(" + _("Level") + " "), "").replace(/\)[\s\S]*/, "")) || 0;
    buildz.snob = buildings && parseInt(buildings.replace(new RegExp("[\\s\\S]*" + _("Academy") + " \\(" + _("Level") + " "), "").replace(/\)[\s\S]*/, "")) || 0;
    buildz.smith = buildings && parseInt(buildings.replace(new RegExp("[\\s\\S]*" + _("Smithy") + " \\(" + _("Level") + " "), "").replace(/\)[\s\S]*/, "")) || 0;
    buildz.statue = buildings && parseInt(buildings.replace(new RegExp("[\\s\\S]*" + _("Statue") + " \\(" + _("Level") + " "), "").replace(/\)[\s\S]*/, "")) || 0;
    buildz.market = buildings && parseInt(buildings.replace(new RegExp("[\\s\\S]*" + _("Market") + " \\(" + _("Level") + " "), "").replace(/\)[\s\S]*/, "")) || 0;
    buildz.main = buildings && parseInt(buildings.replace(new RegExp("[\\s\\S]*" + _("Headquarters") + " \\(" + _("Level") + " "), "").replace(/\)[\s\S]*/, "")) || 0;
    buildz.farm = buildings && parseInt(buildings.replace(new RegExp("[\\s\\S]*" + _("Farm") + " \\(" + _("Level") + " "), "").replace(/\)[\s\S]*/, "")) || 0;
    var linkd = $("<span>" + _("Saved") + "</span>");
    linkd.css("display", "none");

    repTable.parent().before(linkd);
    var progress = addReport(parseInt(reportID), localCoords, vilCoords, wood, clay, iron, battleTime, buildz);
    if (progress === true){
      linkd.text("Saved");
      linkd.css("display", "block").css("color", "");
      console.log("Saved a report! - " + localCoords[0] + "|" + localCoords[1] + " - " + vilCoords[0] + "|" + vilCoords[1] + " - " + parseInt(reportID));
      return true;
    } else {
      linkd.text("Oops! There was an error.");
      linkd.css("display", "block").css("color", "#F00");
      console.log("Error with a report! - " + localCoords[0] + "|" + localCoords[1] + " - " + vilCoords[0] + "|" + vilCoords[1] + " - " + parseInt(reportID));
      return progress;
    }
  }
}
