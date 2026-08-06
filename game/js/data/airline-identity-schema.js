/**
 * Airline Empire airline identity schema and validation helpers.
 *
 * This module is deliberately independent of rendering and gameplay state.
 * It can be imported by data modules, development tools, and tests.
 */

export const AIRLINE_IDENTITY_SCHEMA_VERSION = "1.0.0";

export const AIRLINE_IDENTITY_CATEGORIES = Object.freeze({
  LEGACY_FULL_SERVICE: "legacy-full-service",
  REGIONAL_DOMESTIC: "regional-domestic",
  BUDGET_LOW_COST: "budget-low-cost",
  PREMIUM_BOUTIQUE: "premium-boutique",
  UPSTART_EDGY: "upstart-edgy",
});

export const AIRLINE_IDENTITY_CATEGORY_LABELS = Object.freeze({
  [AIRLINE_IDENTITY_CATEGORIES.LEGACY_FULL_SERVICE]: "Legacy / Full-Service",
  [AIRLINE_IDENTITY_CATEGORIES.REGIONAL_DOMESTIC]: "Regional / Domestic",
  [AIRLINE_IDENTITY_CATEGORIES.BUDGET_LOW_COST]: "Budget / Low-Cost",
  [AIRLINE_IDENTITY_CATEGORIES.PREMIUM_BOUTIQUE]: "Premium / Boutique",
  [AIRLINE_IDENTITY_CATEGORIES.UPSTART_EDGY]: "Upstart / Edgy",
});

const CATEGORY_VALUES = Object.freeze(Object.values(AIRLINE_IDENTITY_CATEGORIES));
const LOGO_SHAPES = Object.freeze([
  "arrow",
  "badge",
  "bird",
  "bolt",
  "circle",
  "cloud",
  "compass",
  "crest",
  "crown",
  "diamond",
  "feather",
  "horizon",
  "mountain",
  "shield",
  "slash",
  "sun",
  "wave",
  "wing",
]);
const SERVICE_LEVELS = Object.freeze([
  "full-service",
  "regional",
  "low-cost",
  "premium",
]);
const PRICING_STRATEGIES = Object.freeze([
  "premium",
  "balanced",
  "value",
  "ultra-low-cost",
  "dynamic",
]);
const NETWORK_STRATEGIES = Object.freeze([
  "global-hub",
  "hub-and-spoke",
  "regional-feeder",
  "point-to-point",
  "secondary-airports",
  "focus-city",
]);
const FLEET_PREFERENCES = Object.freeze([
  "balanced",
  "long-haul",
  "narrowbody",
  "regional",
  "high-density",
  "premium-configured",
]);

export const AIRLINE_IDENTITY_SCHEMA = Object.freeze({
  version: AIRLINE_IDENTITY_SCHEMA_VERSION,
  requiredTopLevelFields: Object.freeze([
    "id",
    "name",
    "shortName",
    "category",
    "tagline",
    "description",
    "theme",
    "logo",
    "palette",
    "livery",
    "commercial",
    "ai",
    "tags",
  ]),
  categories: CATEGORY_VALUES,
  logoShapes: LOGO_SHAPES,
  serviceLevels: SERVICE_LEVELS,
  pricingStrategies: PRICING_STRATEGIES,
  networkStrategies: NETWORK_STRATEGIES,
  fleetPreferences: FLEET_PREFERENCES,
  aiMetricRange: Object.freeze({ min: 0, max: 1 }),
});

const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LOGO_MARK_PATTERN = /^[A-Z0-9&]{1,4}$/;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function addError(errors, path, message) {
  errors.push(`${path}: ${message}`);
}

function requireObject(value, path, errors) {
  if (!isPlainObject(value)) {
    addError(errors, path, "must be an object");
    return false;
  }
  return true;
}

function requireString(value, path, errors, options = {}) {
  const { min = 1, max = 200, pattern = null } = options;
  if (typeof value !== "string") {
    addError(errors, path, "must be a string");
    return;
  }

  const length = value.trim().length;
  if (length < min || length > max) {
    addError(errors, path, `must contain ${min}-${max} non-whitespace characters`);
  }
  if (pattern && !pattern.test(value)) {
    addError(errors, path, "has an invalid format");
  }
}

function requireEnum(value, allowed, path, errors) {
  if (!allowed.includes(value)) {
    addError(errors, path, `must be one of: ${allowed.join(", ")}`);
  }
}

function requireHexColor(value, path, errors) {
  if (typeof value !== "string" || !HEX_COLOR_PATTERN.test(value)) {
    addError(errors, path, "must be an uppercase six-digit hex color such as #0E2D52");
  }
}

function requireMetric(value, path, errors) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    addError(errors, path, "must be a finite number from 0 through 1");
  }
}

function validateLogo(logo, path, errors) {
  if (!requireObject(logo, path, errors)) return;

  requireString(logo.mark, `${path}.mark`, errors, {
    min: 1,
    max: 4,
    pattern: LOGO_MARK_PATTERN,
  });
  requireEnum(logo.shape, LOGO_SHAPES, `${path}.shape`, errors);

  if (logo.assetPath !== undefined && logo.assetPath !== null) {
    requireString(logo.assetPath, `${path}.assetPath`, errors, { min: 1, max: 260 });
  }
}

function validatePalette(palette, path, errors) {
  if (!requireObject(palette, path, errors)) return;

  for (const field of ["primary", "secondary", "accent", "onPrimary"]) {
    requireHexColor(palette[field], `${path}.${field}`, errors);
  }
}

function validateLivery(livery, path, errors) {
  if (!requireObject(livery, path, errors)) return;

  for (const field of ["fuselage", "tail", "stripe", "engine"]) {
    requireHexColor(livery[field], `${path}.${field}`, errors);
  }
  requireEnum(livery.finish, ["gloss", "satin", "matte", "metallic"], `${path}.finish`, errors);
}

function validateCommercial(commercial, path, errors) {
  if (!requireObject(commercial, path, errors)) return;

  requireEnum(commercial.serviceLevel, SERVICE_LEVELS, `${path}.serviceLevel`, errors);
  requireEnum(commercial.pricingStrategy, PRICING_STRATEGIES, `${path}.pricingStrategy`, errors);
  requireEnum(commercial.networkStrategy, NETWORK_STRATEGIES, `${path}.networkStrategy`, errors);
  requireEnum(commercial.fleetPreference, FLEET_PREFERENCES, `${path}.fleetPreference`, errors);
}

function validateAi(ai, path, errors) {
  if (!requireObject(ai, path, errors)) return;

  requireString(ai.archetype, `${path}.archetype`, errors, {
    min: 3,
    max: 60,
    pattern: ID_PATTERN,
  });
  for (const field of [
    "aggression",
    "expansion",
    "priceSensitivity",
    "serviceInvestment",
    "marketing",
    "riskTolerance",
  ]) {
    requireMetric(ai[field], `${path}.${field}`, errors);
  }
}

function validateTags(tags, path, errors) {
  if (!Array.isArray(tags) || tags.length < 1) {
    addError(errors, path, "must be a non-empty array");
    return;
  }

  const seen = new Set();
  tags.forEach((tag, index) => {
    requireString(tag, `${path}[${index}]`, errors, {
      min: 2,
      max: 40,
      pattern: ID_PATTERN,
    });
    if (seen.has(tag)) addError(errors, `${path}[${index}]`, `duplicates tag \"${tag}\"`);
    seen.add(tag);
  });
}

export function validateAirlineIdentity(identity, options = {}) {
  const { path = "identity" } = options;
  const errors = [];
  if (!requireObject(identity, path, errors)) return errors;

  for (const field of AIRLINE_IDENTITY_SCHEMA.requiredTopLevelFields) {
    if (!(field in identity)) addError(errors, `${path}.${field}`, "is required");
  }

  requireString(identity.id, `${path}.id`, errors, { min: 2, max: 80, pattern: ID_PATTERN });
  requireString(identity.name, `${path}.name`, errors, { min: 2, max: 80 });
  requireString(identity.shortName, `${path}.shortName`, errors, { min: 2, max: 40 });
  requireEnum(identity.category, CATEGORY_VALUES, `${path}.category`, errors);
  requireString(identity.tagline, `${path}.tagline`, errors, { min: 4, max: 100 });
  requireString(identity.description, `${path}.description`, errors, { min: 12, max: 300 });
  requireString(identity.theme, `${path}.theme`, errors, { min: 3, max: 100 });

  validateLogo(identity.logo, `${path}.logo`, errors);
  validatePalette(identity.palette, `${path}.palette`, errors);
  validateLivery(identity.livery, `${path}.livery`, errors);
  validateCommercial(identity.commercial, `${path}.commercial`, errors);
  validateAi(identity.ai, `${path}.ai`, errors);
  validateTags(identity.tags, `${path}.tags`, errors);

  return errors;
}

export function validateAirlineIdentities(identities, options = {}) {
  const { expectedCount = null } = options;
  const errors = [];

  if (!Array.isArray(identities)) {
    return ["identities: must be an array"];
  }
  if (identities.length === 0) errors.push("identities: must not be empty");
  if (expectedCount !== null && identities.length !== expectedCount) {
    errors.push(`identities: expected ${expectedCount} entries but found ${identities.length}`);
  }

  const ids = new Map();
  const names = new Map();
  identities.forEach((identity, index) => {
    errors.push(...validateAirlineIdentity(identity, { path: `identities[${index}]` }));

    if (isPlainObject(identity)) {
      if (typeof identity.id === "string") {
        if (ids.has(identity.id)) {
          errors.push(`identities[${index}].id: duplicates identities[${ids.get(identity.id)}].id`);
        } else {
          ids.set(identity.id, index);
        }
      }
      if (typeof identity.name === "string") {
        const normalizedName = identity.name.trim().toLocaleLowerCase("en-US");
        if (names.has(normalizedName)) {
          errors.push(`identities[${index}].name: duplicates identities[${names.get(normalizedName)}].name`);
        } else {
          names.set(normalizedName, index);
        }
      }
    }
  });

  return errors;
}

export function assertValidAirlineIdentities(identities, options = {}) {
  const errors = validateAirlineIdentities(identities, options);
  if (errors.length > 0) {
    throw new TypeError(`Invalid airline identity catalog:\n- ${errors.join("\n- ")}`);
  }
  return identities;
}

export function deepFreezeAirlineIdentities(identities) {
  const freeze = (value) => {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  };
  return freeze(identities);
}
