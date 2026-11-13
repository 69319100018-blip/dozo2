/* ============================================
   Dozo Genshin — Data constants (packages, characters, options)
   ============================================ */

const MATERIAL_TYPES = [
  { id: "ascension", label: "เลื่อนขั้นตัวละคร", sub: "Ascension mats" },
  { id: "talent", label: "Talent / หนังสือ", sub: "สกิลตัวละคร" },
  { id: "weapon", label: "วัสดุอาวุธ", sub: "เลื่อนขั้นอาวุธ" },
  { id: "boss", label: "บอส / รายสัปดาห์", sub: "Boss · Weekly" },
  { id: "local", label: "ของท้องถิ่น", sub: "ฟาร์มโลก" },
  { id: "custom", label: "กำหนดเอง", sub: "ระบุในรายละเอียด" }
];

const BUILD_GOALS = [
  { id: "level-90", label: "ปั้นถึง Lv.90", sub: "เลเวลเต็ม" },
  { id: "ascension-only", label: "เลื่อนขั้นอย่างเดียว", sub: "Ascension" },
  { id: "talent-focus", label: "เน้น Talent", sub: "อัพสกิล" },
  { id: "full-build", label: "ปั้นครบชุด", sub: "เลเวล + Talent" },
  { id: "custom", label: "กำหนดเอง", sub: "ระบุรายละเอียด" }
];

const ABYSS_OPTIONS = [
  { id: "floor-9-10", label: "ชั้น 9–10", sub: "30 ฿", price: 30 },
  { id: "floor-9-11", label: "ชั้น 9–11", sub: "60 ฿", price: 60 },
  { id: "floor-9-12", label: "ชั้น 9–12", sub: "120 ฿", price: 120 },
  { id: "floor-11-12", label: "ชั้น 11–12", sub: "100 ฿", price: 100 },
  { id: "full-36", label: "36 ดาว", sub: "170 ฿", price: 170 },
];

const EXPLORE_OPTIONS = [
  { id: "mondstadt", label: "Mondstadt", areas: 6 },
  { id: "liyue", label: "Liyue", areas: 9 },
  { id: "inazuma", label: "Inazuma", areas: 6 },
  { id: "sumeru", label: "Sumeru", areas: 13 },
  { id: "fontaine", label: "Fontaine", areas: 8 },
  { id: "natlan", label: "Natlan", areas: 9 },
  { id: "nod-krai", label: "Nod-Krai", areas: 7 },
  { id: "enkanomiya", label: "Enkanomiya", areas: 3 },
  { id: "chasm", label: "The Chasm", areas: 3 },
  { id: "sea-of-bygone", label: "Sea of Bygone Eras", areas: 3 },
  { id: "ancient-sacred-mountain", label: "Ancient Sacred Mountain", areas: 6 },
  { id: "temple-of-space", label: "Temple of Space", areas: 3 },
  { id: "frostmoon", label: "Frostmoon", areas: 3 },
].map((opt) => ({ ...opt, sub: `${opt.areas} พื้นที่` }));

const EXPLORE_RATE_PER_PERCENT = 2; // 1% = 2 ฿ ต่อ 1 พื้นที่
const EXPLORE_AREA_LIMITS = Object.fromEntries(
  EXPLORE_OPTIONS.map((opt) => [opt.id, opt.areas])
);

// ---------- Packages: ลูกค้าปกติ (cus) ----------
const CUSTOMER_PACKAGES = [
  { gems: 160, price: 10 },
  { gems: 320, price: 18 },
  { gems: 480, price: 29 },
  { gems: 680, price: 36 },
  { gems: 800, price: 49 },
  { gems: 1600, price: 90 },
  { gems: 3200, price: 180 },
  { gems: 4800, price: 290 },
  { gems: 6400, price: 380 },
  { gems: 8000, price: 490 },
  { gems: 9600, price: 570 },
  { gems: 11200, price: 695 },
  { gems: 12800, price: 785 },
  { gems: 14400, price: 895 },
  { gems: 16000, price: 1090 },
];

// ---------- Packages: สมาชิก (mem) ----------
const MEMBER_PACKAGES = [
  { gems: 160, price: 10 },
  { gems: 320, price: 18 },
  { gems: 480, price: 29 },
  { gems: 680, price: 36 },
  { gems: 800, price: 49 },
  { gems: 1600, price: 90 },
  { gems: 3200, price: 180 },
  { gems: 4800, price: 275 },
  { gems: 6400, price: 361 },
  { gems: 8000, price: 465 },
  { gems: 9600, price: 541 },
  { gems: 11200, price: 660 },
  { gems: 12800, price: 745 },
  { gems: 14400, price: 850 },
  { gems: 16000, price: 1035 },
];

function getActivePackages() {
  return isMemberUser() ? MEMBER_PACKAGES : CUSTOMER_PACKAGES;
}

function isMemberUser() {
  const role = currentUser?.role;
  return role === "member" || role === "staff" || role === "admin";
}

// ---------- รายชื่อตัวละคร Genshin (playable) ----------
const CHARACTERS = [
  // Mondstadt
  "Albedo", "Amber", "Barbara", "Bennett", "Diluc", "Diona", "Eula", "Fischl",
  "Jean", "Kaeya", "Klee", "Lisa", "Mika", "Mona", "Noelle", "Razor", "Rosaria",
  "Sucrose", "Venti",
  // Liyue
  "Baizhu", "Beidou", "Chongyun", "Gaming", "Ganyu", "Hu Tao", "Keqing",
  "Ningguang", "Qiqi", "Shenhe", "Xiangling", "Xingqiu", "Xinyan", "Yanfei",
  "Yaoyao", "Yun Jin", "Zhongli", "Xianyun",
  // Inazuma
  "Arataki Itto", "Gorou", "Kaedehara Kazuha", "Kamisato Ayaka", "Kamisato Ayato",
  "Kujou Sara", "Kuki Shinobu", "Raiden Shogun", "Sangonomiya Kokomi",
  "Sayu", "Shikanoin Heizou", "Thoma", "Yae Miko", "Yoimiya", "Kirara",
  // Sumeru
  "Alhaitham", "Candace", "Collei", "Cyno", "Dehya", "Dori", "Faruzan",
  "Kaveh", "Layla", "Nahida", "Nilou", "Tighnari", "Wanderer", "Sethos",
  // Fontaine
  "Charlotte", "Chevreuse", "Clorinde", "Emilie", "Freminet", "Furina",
  "Lynette", "Lyney", "Navia", "Neuvillette", "Sigewinne", "Wriothesley",
  // Natlan
  "Chasca", "Citlali", "Iansan", "Kachina", "Kinich", "Mualani", "Ororon",
  "Xilonen", "Mavuika",
  // Other / Traveler
  "Traveler (Anemo)", "Traveler (Geo)", "Traveler (Electro)", "Traveler (Dendro)",
  "Traveler (Hydro)", "Traveler (Pyro)", "Aloy"
].sort((a, b) => a.localeCompare(b));


let selectedPackage = null;
let hasSlip = false;
let selectedFarmSlipFile = null;
let hasFarmMap = false;
let selectedFarmMapFile = null;
let selectedMatScreenshotFile = null;
let selectedMatSlipFile = null;
let selectedBuildScreenshotFile = null;
let selectedBuildSlipFile = null;
let selectedAbyssSlipFile = null;
let selectedExploreSlipFile = null;

let selectedMaterialType = null;
let hasMatShot = false;
let hasMatSlip = false;

let selectedBuildCharacter = null;
let selectedBuildGoal = null;
let hasBuildShot = false;
let hasBuildSlip = false;

