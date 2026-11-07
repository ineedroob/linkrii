const AURAS = [
  {
    name: "Basic",
    rarity: "BASIC",
    odds: "1 in 2",
    weight: 48,
    boxId: "24624607800000"
  },
  {
    name: "Common",
    rarity: "COMMON",
    odds: "1 in 5",
    weight: 28.8,
    boxId: "246246012350000"
  },
  {
    name: "Uncommon",
    rarity: "UNCOMMON",
    odds: "1 in 10",
    weight: 19.2,
    boxId: "246246050150150"
  },
  {
    name: "Rare",
    rarity: "RARE",
    odds: "1 in 25",
    weight: 4,
    boxId: "246246078246246"
  }
];

// selects a random aura
function chooseAura() {
  const totalWeight = AURAS.reduce(
    (sum, aura) => sum + aura.weight,
    0
  );

  let roll = Math.random() * totalWeight;

  for (const aura of AURAS) {
    roll -= aura.weight;

    if (roll < 0) {
      return aura;
    }
  }

  return AURAS[AURAS.length - 1];
}

function roll() {
  const result = chooseAura();

  const destination =
    "https://infinitehomepage.com/" + result.boxId;

  window.location.replace(destination);
}

roll();
