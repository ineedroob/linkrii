// Temporary test odds: Basic 50%, Common 30%, Uncommon 20%.
// The box IDs are strings so they remain exact.
const BOXES = [
  { id: "24624607800000", weight: 50 },   // Basic
  { id: "246246012350000", weight: 30 }, // Common
  { id: "246246050150150", weight: 20 }  // Uncommon
];

function chooseBox() {
  const total = BOXES.reduce((sum, box) => sum + box.weight, 0);
  let roll = Math.random() * total;

  for (const box of BOXES) {
    roll -= box.weight;
    if (roll < 0) return box;
  }
  return BOXES[BOXES.length - 1];
}

const selected = chooseBox();
window.location.replace(
  "https://infinitehomepage.com/" + encodeURIComponent(selected.id)
);
