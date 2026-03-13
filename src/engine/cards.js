// ---------------------------------------------------------------------------
// Monopoly Deal -- Complete deck definition
// ---------------------------------------------------------------------------
// Card counts: 20 money + 28 property + 11 wild + 35 action + 13 rent = 107
// ---------------------------------------------------------------------------

// ========================== PROPERTY CONFIG ==========================

export const PROPERTY_CONFIG = {
  brown:     { setSize: 2, rent: [1, 2],       names: ['Mediterranean Ave', 'Baltic Ave'] },
  lightblue: { setSize: 3, rent: [1, 2, 3],    names: ['Oriental Ave', 'Vermont Ave', 'Connecticut Ave'] },
  pink:      { setSize: 3, rent: [1, 2, 4],    names: ['St. Charles Place', 'States Ave', 'Virginia Ave'] },
  orange:    { setSize: 3, rent: [1, 3, 5],    names: ['St. James Place', 'Tennessee Ave', 'New York Ave'] },
  red:       { setSize: 3, rent: [2, 3, 6],    names: ['Kentucky Ave', 'Indiana Ave', 'Illinois Ave'] },
  yellow:    { setSize: 3, rent: [2, 4, 6],    names: ['Ventnor Ave', 'Marvin Gardens', 'Atlantic Ave'] },
  green:     { setSize: 3, rent: [2, 4, 7],    names: ['Pacific Ave', 'North Carolina Ave', 'Pennsylvania Ave'] },
  darkblue:  { setSize: 2, rent: [3, 8],       names: ['Park Place', 'Boardwalk'] },
  railroad:  { setSize: 4, rent: [1, 2, 3, 4], names: ['Reading Railroad', 'Pennsylvania Railroad', 'B&O Railroad', 'Short Line'] },
  utility:   { setSize: 2, rent: [1, 2],       names: ['Electric Company', 'Water Works'] },
};

const ALL_COLORS = Object.keys(PROPERTY_CONFIG);

// ========================== HELPER BUILDERS ==========================

function buildPropertyCard(color, index) {
  const cfg = PROPERTY_CONFIG[color];
  const name = cfg.names[index];

  // Property values by color (bank value when used as money)
  const propertyValues = {
    brown: 1, lightblue: 1, pink: 2, orange: 2,
    red: 3, yellow: 3, green: 4, darkblue: 4,
    railroad: 2, utility: 2,
  };

  return {
    id: `property-${color}-${index + 1}`,
    type: 'property',
    name,
    value: propertyValues[color],
    color,
    rent: cfg.rent,
    setSize: cfg.setSize,
  };
}

function buildMoneyCard(denomination, index) {
  return {
    id: `money-${denomination}m-${index + 1}`,
    type: 'money',
    name: `$${denomination}M`,
    value: denomination,
  };
}

function buildActionCard(key, index, { value, name, description }) {
  return {
    id: `action-${key}-${index + 1}`,
    type: 'action',
    name,
    value,
    description,
  };
}

function buildRentCard(key, index, { value, rentColors, targetsAll }) {
  const name = targetsAll
    ? `${rentColors.map(c => colorLabel(c)).join('/')} Rent`
    : 'Any Color Rent';

  return {
    id: `rent-${key}-${index + 1}`,
    type: 'rent',
    name,
    value,
    rentColors,
    targetsAll,
  };
}

function buildWildCard(key, index, { value, colors, isRainbowWild }) {
  const primaryColor = colors[0];
  const cfg = PROPERTY_CONFIG[primaryColor];
  const name = isRainbowWild
    ? 'Rainbow Wild'
    : `${colorLabel(colors[0])}/${colorLabel(colors[1])} Wild`;

  return {
    id: `wild-${key}-${index + 1}`,
    type: 'wild',
    name,
    value,
    color: primaryColor,
    colors,
    isRainbowWild: !!isRainbowWild,
    rent: cfg.rent,
    setSize: cfg.setSize,
  };
}

/** Capitalize a color key for display (e.g. 'lightblue' -> 'Light Blue'). */
function colorLabel(color) {
  const labels = {
    brown: 'Brown',
    lightblue: 'Light Blue',
    pink: 'Pink',
    orange: 'Orange',
    red: 'Red',
    yellow: 'Yellow',
    green: 'Green',
    darkblue: 'Dark Blue',
    railroad: 'Railroad',
    utility: 'Utility',
  };
  return labels[color] || color;
}

// ========================== CARD GENERATION ==========================

// --- Money cards (20) ---
const moneyCards = [
  ...Array.from({ length: 6 }, (_, i) => buildMoneyCard(1, i)),
  ...Array.from({ length: 5 }, (_, i) => buildMoneyCard(2, i)),
  ...Array.from({ length: 3 }, (_, i) => buildMoneyCard(3, i)),
  ...Array.from({ length: 3 }, (_, i) => buildMoneyCard(4, i)),
  ...Array.from({ length: 2 }, (_, i) => buildMoneyCard(5, i)),
  buildMoneyCard(10, 0),
];

// --- Property cards (28) ---
const propertyCards = Object.keys(PROPERTY_CONFIG).flatMap(color =>
  PROPERTY_CONFIG[color].names.map((_, i) => buildPropertyCard(color, i)),
);

// --- Wild property cards (11) ---
const wildCards = [
  // Rainbow wild x2 -- value $0, works as any color
  ...Array.from({ length: 2 }, (_, i) =>
    buildWildCard('rainbow', i, {
      value: 0,
      colors: ALL_COLORS,
      isRainbowWild: true,
    }),
  ),
  // Light Blue / Brown x1 -- value $1
  buildWildCard('lightblue-brown', 0, {
    value: 1,
    colors: ['lightblue', 'brown'],
  }),
  // Light Blue / Railroad x2 -- value $4
  ...Array.from({ length: 2 }, (_, i) =>
    buildWildCard('lightblue-railroad', i, {
      value: 4,
      colors: ['lightblue', 'railroad'],
    }),
  ),
  // Pink / Orange x2 -- value $2
  ...Array.from({ length: 2 }, (_, i) =>
    buildWildCard('pink-orange', i, {
      value: 2,
      colors: ['pink', 'orange'],
    }),
  ),
  // Red / Yellow x2 -- value $3
  ...Array.from({ length: 2 }, (_, i) =>
    buildWildCard('red-yellow', i, {
      value: 3,
      colors: ['red', 'yellow'],
    }),
  ),
  // Green / Dark Blue x1 -- value $4
  buildWildCard('green-darkblue', 0, {
    value: 4,
    colors: ['green', 'darkblue'],
  }),
  // Dark Blue / Railroad x1 -- value $4
  buildWildCard('darkblue-railroad', 0, {
    value: 4,
    colors: ['darkblue', 'railroad'],
  }),
];

// --- Action cards (35) ---
const actionCardDefs = [
  { key: 'pass-go',         count: 10, value: 1, name: 'Pass Go',          description: 'Draw 2 extra cards' },
  { key: 'deal-breaker',    count: 2,  value: 5, name: 'Deal Breaker',     description: 'Steal a complete property set from any player' },
  { key: 'sly-deal',        count: 3,  value: 3, name: 'Sly Deal',         description: 'Steal 1 property not in a complete set' },
  { key: 'forced-deal',     count: 4,  value: 3, name: 'Forced Deal',      description: 'Swap 1 of your properties with 1 opponent property' },
  { key: 'debt-collector',  count: 3,  value: 3, name: 'Debt Collector',   description: 'One player pays you $5M' },
  { key: 'its-my-birthday', count: 3,  value: 2, name: "It's My Birthday", description: 'All other players pay you $2M each' },
  { key: 'just-say-no',     count: 3,  value: 4, name: 'Just Say No',      description: 'Cancel any action targeting you' },
  { key: 'double-the-rent', count: 2,  value: 1, name: 'Double the Rent',  description: 'Double the rent charged' },
  { key: 'house',           count: 3,  value: 3, name: 'House',            description: 'Add to a complete set, rent +$3M' },
  { key: 'hotel',           count: 2,  value: 4, name: 'Hotel',            description: 'Add to a complete set with a house, rent +$4M' },
];

const actionCards = actionCardDefs.flatMap(({ key, count, ...rest }) =>
  Array.from({ length: count }, (_, i) => buildActionCard(key, i, rest)),
);

// --- Rent cards (13) ---
const rentCardDefs = [
  { key: 'any-color',          count: 3, value: 3, rentColors: ALL_COLORS,              targetsAll: false },
  { key: 'brown-lightblue',    count: 2, value: 1, rentColors: ['brown', 'lightblue'],  targetsAll: true },
  { key: 'pink-orange',        count: 2, value: 1, rentColors: ['pink', 'orange'],       targetsAll: true },
  { key: 'red-yellow',         count: 2, value: 1, rentColors: ['red', 'yellow'],        targetsAll: true },
  { key: 'green-darkblue',     count: 2, value: 1, rentColors: ['green', 'darkblue'],    targetsAll: true },
  { key: 'railroad-utility',   count: 2, value: 1, rentColors: ['railroad', 'utility'],  targetsAll: true },
];

const rentCards = rentCardDefs.flatMap(({ key, count, ...rest }) =>
  Array.from({ length: count }, (_, i) => buildRentCard(key, i, rest)),
);

// ========================== FINAL DECK ==========================

export const ALL_CARDS = [
  ...moneyCards,
  ...propertyCards,
  ...wildCards,
  ...actionCards,
  ...rentCards,
];

export default ALL_CARDS;
