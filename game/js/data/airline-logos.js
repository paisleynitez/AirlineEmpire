/* Airline Empire — Image Logo Catalog
 * Stable IDs are filename stems. Save files store logoId, never the asset path.
 */
(function(){
  'use strict';
  const GROUP_LABELS = {
  "speed-motion": "Speed / Motion",
  "nature-sky": "Nature / Sky",
  "bold-modern": "Bold / Modern",
  "mythological-epic": "Mythological / Epic",
  "colors-visual": "Colors / Visual",
  "stars-cosmos": "Stars / Cosmos",
  "prestige-budget-lcc": "Budget / LCC",
  "luxury-ultra-premium": "Luxury / Ultra-Premium"
};
  const AIRLINE_LOGOS = [
  {
    "id": "accelerate_air",
    "name": "Accelerate Air",
    "group": "speed-motion",
    "image": "/assets/logos/airlines/speed-motion/accelerate_air.png"
  },
  {
    "id": "blaze_airlines",
    "name": "Blaze Airlines",
    "group": "speed-motion",
    "image": "/assets/logos/airlines/speed-motion/blaze_airlines.png"
  },
  {
    "id": "bolt_air",
    "name": "Bolt Air",
    "group": "speed-motion",
    "image": "/assets/logos/airlines/speed-motion/bolt_air.png"
  },
  {
    "id": "dash_airways",
    "name": "Dash Airways",
    "group": "speed-motion",
    "image": "/assets/logos/airlines/speed-motion/dash_airways.png"
  },
  {
    "id": "flux_airlines",
    "name": "Flux Airlines",
    "group": "speed-motion",
    "image": "/assets/logos/airlines/speed-motion/flux_airlines.png"
  },
  {
    "id": "impulse_airways",
    "name": "Impulse Airways",
    "group": "speed-motion",
    "image": "/assets/logos/airlines/speed-motion/impulse_airways.png"
  },
  {
    "id": "kinetic_airlines",
    "name": "Kinetic Airlines",
    "group": "speed-motion",
    "image": "/assets/logos/airlines/speed-motion/kinetic_airlines.png"
  },
  {
    "id": "mach_airways",
    "name": "Mach Airways",
    "group": "speed-motion",
    "image": "/assets/logos/airlines/speed-motion/mach_airways.png"
  },
  {
    "id": "momentum_air",
    "name": "Momentum Air",
    "group": "speed-motion",
    "image": "/assets/logos/airlines/speed-motion/momentum_air.png"
  },
  {
    "id": "overdrive_airlines",
    "name": "Overdrive Airlines",
    "group": "speed-motion",
    "image": "/assets/logos/airlines/speed-motion/overdrive_airlines.png"
  },
  {
    "id": "propel_airways",
    "name": "Propel Airways",
    "group": "speed-motion",
    "image": "/assets/logos/airlines/speed-motion/propel_airways.png"
  },
  {
    "id": "rapid_wings",
    "name": "Rapid Wings",
    "group": "speed-motion",
    "image": "/assets/logos/airlines/speed-motion/rapid_wings.png"
  },
  {
    "id": "sprint_airlines",
    "name": "Sprint Airlines",
    "group": "speed-motion",
    "image": "/assets/logos/airlines/speed-motion/sprint_airlines.png"
  },
  {
    "id": "surge_air",
    "name": "Surge Air",
    "group": "speed-motion",
    "image": "/assets/logos/airlines/speed-motion/surge_air.png"
  },
  {
    "id": "swift_air",
    "name": "Swift Air",
    "group": "speed-motion",
    "image": "/assets/logos/airlines/speed-motion/swift_air.png"
  },
  {
    "id": "thrust_airlines",
    "name": "Thrust Airlines",
    "group": "speed-motion",
    "image": "/assets/logos/airlines/speed-motion/thrust_airlines.png"
  },
  {
    "id": "torque_air",
    "name": "Torque Air",
    "group": "speed-motion",
    "image": "/assets/logos/airlines/speed-motion/torque_air.png"
  },
  {
    "id": "velocity_airlines",
    "name": "Velocity Airlines",
    "group": "speed-motion",
    "image": "/assets/logos/airlines/speed-motion/velocity_airlines.png"
  },
  {
    "id": "aurora_airlines",
    "name": "Aurora Airlines",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/aurora_airlines.png"
  },
  {
    "id": "bora_airlines",
    "name": "Bora Airlines",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/bora_airlines.png"
  },
  {
    "id": "chinook_airlines",
    "name": "Chinook Airlines",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/chinook_airlines.png"
  },
  {
    "id": "cirrus_airlines",
    "name": "Cirrus Airlines",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/cirrus_airlines.png"
  },
  {
    "id": "crestwave_air",
    "name": "Crestwave Air",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/crestwave_air.png"
  },
  {
    "id": "cumulus_airlines",
    "name": "Cumulus Airlines",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/cumulus_airlines.png"
  },
  {
    "id": "equinox_airlines",
    "name": "Equinox Airlines",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/equinox_airlines.png"
  },
  {
    "id": "etesian_airlines",
    "name": "Etesian Airlines",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/etesian_airlines.png"
  },
  {
    "id": "foehn_airways",
    "name": "Foehn Airways",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/foehn_airways.png"
  },
  {
    "id": "gale_air",
    "name": "Gale Air",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/gale_air.png"
  },
  {
    "id": "haboob_air",
    "name": "Haboob Air",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/haboob_air.png"
  },
  {
    "id": "horizon_air",
    "name": "Horizon Air",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/horizon_air.png"
  },
  {
    "id": "levante_airways",
    "name": "Levante Airways",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/levante_airways.png"
  },
  {
    "id": "luminos_airlines",
    "name": "Luminos Airlines",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/luminos_airlines.png"
  },
  {
    "id": "mistral_airways",
    "name": "Mistral Airways",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/mistral_airways.png"
  },
  {
    "id": "nimbus_airways",
    "name": "Nimbus Airways",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/nimbus_airways.png"
  },
  {
    "id": "radiance_air",
    "name": "Radiance Air",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/radiance_air.png"
  },
  {
    "id": "sirocco_air",
    "name": "Sirocco Air",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/sirocco_air.png"
  },
  {
    "id": "solara_airways",
    "name": "Solara Airways",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/solara_airways.png"
  },
  {
    "id": "solstice_airways",
    "name": "Solstice Airways",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/solstice_airways.png"
  },
  {
    "id": "stratus_air",
    "name": "Stratus Air",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/stratus_air.png"
  },
  {
    "id": "tempest_airlines",
    "name": "Tempest Airlines",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/tempest_airlines.png"
  },
  {
    "id": "thermal_airways",
    "name": "Thermal Airways",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/thermal_airways.png"
  },
  {
    "id": "tramontane_air",
    "name": "Tramontane Air",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/tramontane_air.png"
  },
  {
    "id": "zephyr_air",
    "name": "Zephyr Air",
    "group": "nature-sky",
    "image": "/assets/logos/airlines/nature-sky/zephyr_air.png"
  },
  {
    "id": "apex_global",
    "name": "Apex Global",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/apex_global.png"
  },
  {
    "id": "axial_airways",
    "name": "Axial Airways",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/axial_airways.png"
  },
  {
    "id": "axis_air",
    "name": "Axis Air",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/axis_air.png"
  },
  {
    "id": "cascade_airlines",
    "name": "Cascade Airlines",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/cascade_airlines.png"
  },
  {
    "id": "cipher_air",
    "name": "Cipher Air",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/cipher_air.png"
  },
  {
    "id": "cipher_airlines",
    "name": "Cipher Airlines",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/cipher_airlines.png"
  },
  {
    "id": "fractal_airways",
    "name": "Fractal Airways",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/fractal_airways.png"
  },
  {
    "id": "fulcrum_airways",
    "name": "Fulcrum Airways",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/fulcrum_airways.png"
  },
  {
    "id": "helix_airways",
    "name": "Helix Airways",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/helix_airways.png"
  },
  {
    "id": "lattice_air",
    "name": "Lattice Air",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/lattice_air.png"
  },
  {
    "id": "matrix_air",
    "name": "Matrix Air",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/matrix_air.png"
  },
  {
    "id": "meridian_nova",
    "name": "Meridian Nova",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/meridian_nova.png"
  },
  {
    "id": "nexus_airways",
    "name": "Nexus Airways",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/nexus_airways.png"
  },
  {
    "id": "nova_airlines",
    "name": "Nova Airlines",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/nova_airlines.png"
  },
  {
    "id": "orbit_airlines",
    "name": "Orbit Airlines",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/orbit_airlines.png"
  },
  {
    "id": "parallax_air",
    "name": "Parallax Air",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/parallax_air.png"
  },
  {
    "id": "polaris_air",
    "name": "Polaris Air",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/polaris_air.png"
  },
  {
    "id": "prism_air",
    "name": "Prism Air",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/prism_air.png"
  },
  {
    "id": "quasar_airlines",
    "name": "Quasar Airlines",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/quasar_airlines.png"
  },
  {
    "id": "spectra_air",
    "name": "Spectra Air",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/spectra_air.png"
  },
  {
    "id": "tesseract_airlines",
    "name": "Tesseract Airlines",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/tesseract_airlines.png"
  },
  {
    "id": "vector_airways",
    "name": "Vector Airways",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/vector_airways.png"
  },
  {
    "id": "vertex_airlines",
    "name": "Vertex Airlines",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/vertex_airlines.png"
  },
  {
    "id": "vortex_airlines",
    "name": "Vortex Airlines",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/vortex_airlines.png"
  },
  {
    "id": "zenith_air",
    "name": "Zenith Air",
    "group": "bold-modern",
    "image": "/assets/logos/airlines/bold-modern/zenith_air.png"
  },
  {
    "id": "aeolus_airlines",
    "name": "Aeolus Airlines",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/aeolus_airlines.png"
  },
  {
    "id": "aether_airlines",
    "name": "Aether Airlines",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/aether_airlines.png"
  },
  {
    "id": "anzu_airlines",
    "name": "Anzu Airlines",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/anzu_airlines.png"
  },
  {
    "id": "atlas_airlines",
    "name": "Atlas Airlines",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/atlas_airlines.png"
  },
  {
    "id": "boreas_airways",
    "name": "Boreas Airways",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/boreas_airways.png"
  },
  {
    "id": "fenrir_airlines",
    "name": "Fenrir Airlines",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/fenrir_airlines.png"
  },
  {
    "id": "garuda_airlines",
    "name": "Garuda Airlines",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/garuda_airlines.png"
  },
  {
    "id": "griffin_airlines",
    "name": "Griffin Airlines",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/griffin_airlines.png"
  },
  {
    "id": "helios_air",
    "name": "Helios Air",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/helios_air.png"
  },
  {
    "id": "hermes_airways",
    "name": "Hermes Airways",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/hermes_airways.png"
  },
  {
    "id": "hyperion_air",
    "name": "Hyperion Air",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/hyperion_air.png"
  },
  {
    "id": "icarus_airlines",
    "name": "Icarus Airlines",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/icarus_airlines.png"
  },
  {
    "id": "mjolnir_airways",
    "name": "Mjolnir Airways",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/mjolnir_airways.png"
  },
  {
    "id": "odin_air",
    "name": "Odin Air",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/odin_air.png"
  },
  {
    "id": "olympus_airways",
    "name": "Olympus Airways",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/olympus_airways.png"
  },
  {
    "id": "pegasus_air",
    "name": "Pegasus Air",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/pegasus_air.png"
  },
  {
    "id": "phoenix_air",
    "name": "Phoenix Air",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/phoenix_air.png"
  },
  {
    "id": "rukh_airways",
    "name": "Rukh Airways",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/rukh_airways.png"
  },
  {
    "id": "selene_airlines",
    "name": "Selene Airlines",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/selene_airlines.png"
  },
  {
    "id": "simurgh_air",
    "name": "Simurgh Air",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/simurgh_air.png"
  },
  {
    "id": "sleipnir_air",
    "name": "Sleipnir Air",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/sleipnir_air.png"
  },
  {
    "id": "thunderbird_air",
    "name": "Thunderbird Air",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/thunderbird_air.png"
  },
  {
    "id": "titan_airways",
    "name": "Titan Airways",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/titan_airways.png"
  },
  {
    "id": "valkyrie_airways",
    "name": "Valkyrie Airways",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/valkyrie_airways.png"
  },
  {
    "id": "zephyros_air",
    "name": "Zephyros Air",
    "group": "mythological-epic",
    "image": "/assets/logos/airlines/mythological-epic/zephyros_air.png"
  },
  {
    "id": "alabaster_airways",
    "name": "Alabaster Airways",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/alabaster_airways.png"
  },
  {
    "id": "alizarin_air",
    "name": "Alizarin Air",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/alizarin_air.png"
  },
  {
    "id": "amber_airways",
    "name": "Amber Airways",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/amber_airways.png"
  },
  {
    "id": "carmine_airlines",
    "name": "Carmine Airlines",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/carmine_airlines.png"
  },
  {
    "id": "cerulean_air",
    "name": "Cerulean Air",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/cerulean_air.png"
  },
  {
    "id": "cobalt_airlines",
    "name": "Cobalt Airlines",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/cobalt_airlines.png"
  },
  {
    "id": "crimson_air",
    "name": "Crimson Air",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/crimson_air.png"
  },
  {
    "id": "flax_airways",
    "name": "Flax Airways",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/flax_airways.png"
  },
  {
    "id": "goldenrod_air",
    "name": "Goldenrod Air",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/goldenrod_air.png"
  },
  {
    "id": "indigo_wings",
    "name": "Indigo Wings",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/indigo_wings.png"
  },
  {
    "id": "ivory_airlines",
    "name": "Ivory Airlines",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/ivory_airlines.png"
  },
  {
    "id": "jade_air",
    "name": "Jade Air",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/jade_air.png"
  },
  {
    "id": "magenta_airlines",
    "name": "Magenta Airlines",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/magenta_airlines.png"
  },
  {
    "id": "obsidian_airways",
    "name": "Obsidian Airways",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/obsidian_airways.png"
  },
  {
    "id": "onyx_airways",
    "name": "Onyx Airways",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/onyx_airways.png"
  },
  {
    "id": "periwinkle_air",
    "name": "Periwinkle Air",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/periwinkle_air.png"
  },
  {
    "id": "russet_airlines",
    "name": "Russet Airlines",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/russet_airlines.png"
  },
  {
    "id": "saffron_airways",
    "name": "Saffron Airways",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/saffron_airways.png"
  },
  {
    "id": "scarlet_air",
    "name": "Scarlet Air",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/scarlet_air.png"
  },
  {
    "id": "sienna_air",
    "name": "Sienna Air",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/sienna_air.png"
  },
  {
    "id": "slate_airways",
    "name": "Slate Airways",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/slate_airways.png"
  },
  {
    "id": "teal_sky_airlines",
    "name": "Teal Sky Airlines",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/teal_sky_airlines.png"
  },
  {
    "id": "umber_air",
    "name": "Umber Air",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/umber_air.png"
  },
  {
    "id": "vermillion_airlines",
    "name": "Vermillion Airlines",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/vermillion_airlines.png"
  },
  {
    "id": "viridian_airlines",
    "name": "Viridian Airlines",
    "group": "colors-visual",
    "image": "/assets/logos/airlines/colors-visual/viridian_airlines.png"
  },
  {
    "id": "aldebaran_airways",
    "name": "Aldebaran Airways",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/aldebaran_airways.png"
  },
  {
    "id": "altair_airways",
    "name": "Altair Airways",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/altair_airways.png"
  },
  {
    "id": "antares_airways",
    "name": "Antares Airways",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/antares_airways.png"
  },
  {
    "id": "arcturus_air",
    "name": "Arcturus Air",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/arcturus_air.png"
  },
  {
    "id": "betelgeuse_air",
    "name": "Betelgeuse Air",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/betelgeuse_air.png"
  },
  {
    "id": "canopus_airlines",
    "name": "Canopus Airlines",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/canopus_airlines.png"
  },
  {
    "id": "capella_airways",
    "name": "Capella Airways",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/capella_airways.png"
  },
  {
    "id": "castor_airways",
    "name": "Castor Airways",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/castor_airways.png"
  },
  {
    "id": "cosmos_airways",
    "name": "Cosmos Airways",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/cosmos_airways.png"
  },
  {
    "id": "deneb_air",
    "name": "Deneb Air",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/deneb_air.png"
  },
  {
    "id": "fomalhaut_airlines",
    "name": "Fomalhaut Airlines",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/fomalhaut_airlines.png"
  },
  {
    "id": "galaxy_airlines",
    "name": "Galaxy Airlines",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/galaxy_airlines.png"
  },
  {
    "id": "hadar_airways",
    "name": "Hadar Airways",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/hadar_airways.png"
  },
  {
    "id": "mimosa_air",
    "name": "Mimosa Air",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/mimosa_air.png"
  },
  {
    "id": "nebula_air",
    "name": "Nebula Air",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/nebula_air.png"
  },
  {
    "id": "pollux_air",
    "name": "Pollux Air",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/pollux_air.png"
  },
  {
    "id": "procyon_airlines",
    "name": "Procyon Airlines",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/procyon_airlines.png"
  },
  {
    "id": "pulsar_air",
    "name": "Pulsar Air",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/pulsar_air.png"
  },
  {
    "id": "regulus_airlines",
    "name": "Regulus Airlines",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/regulus_airlines.png"
  },
  {
    "id": "rigel_airlines",
    "name": "Rigel Airlines",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/rigel_airlines.png"
  },
  {
    "id": "sirius_air",
    "name": "Sirius Air",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/sirius_air.png"
  },
  {
    "id": "solaris_airways",
    "name": "Solaris Airways",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/solaris_airways.png"
  },
  {
    "id": "spica_air",
    "name": "Spica Air",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/spica_air.png"
  },
  {
    "id": "stellar_airlines",
    "name": "Stellar Airlines",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/stellar_airlines.png"
  },
  {
    "id": "vega_airlines",
    "name": "Vega Airlines",
    "group": "stars-cosmos",
    "image": "/assets/logos/airlines/stars-cosmos/vega_airlines.png"
  },
  {
    "id": "breezair",
    "name": "Breezair",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/breezair.png"
  },
  {
    "id": "brightpath_air",
    "name": "Brightpath Air",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/brightpath_air.png"
  },
  {
    "id": "budgetwings",
    "name": "Budgetwings",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/budgetwings.png"
  },
  {
    "id": "cleanroute_airlines",
    "name": "Cleanroute Airlines",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/cleanroute_airlines.png"
  },
  {
    "id": "clearroute_airways",
    "name": "Clearroute Airways",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/clearroute_airways.png"
  },
  {
    "id": "clearsky_airlines",
    "name": "Clearsky Airlines",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/clearsky_airlines.png"
  },
  {
    "id": "directfly_airlines",
    "name": "Directfly Airlines",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/directfly_airlines.png"
  },
  {
    "id": "easyspan_air",
    "name": "Easyspan Air",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/easyspan_air.png"
  },
  {
    "id": "ecoair",
    "name": "Ecoair",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/ecoair.png"
  },
  {
    "id": "flatfare_air",
    "name": "Flatfare Air",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/flatfare_air.png"
  },
  {
    "id": "flyfast_airlines",
    "name": "Flyfast Airlines",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/flyfast_airlines.png"
  },
  {
    "id": "freedomjet_airlines",
    "name": "Freedomjet Airlines",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/freedomjet_airlines.png"
  },
  {
    "id": "freshair_jets",
    "name": "Freshair Jets",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/freshair_jets.png"
  },
  {
    "id": "greenleaf_airlines",
    "name": "Greenleaf Airlines",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/greenleaf_airlines.png"
  },
  {
    "id": "leanjet_air",
    "name": "Leanjet Air",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/leanjet_air.png"
  },
  {
    "id": "openroute_airlines",
    "name": "Openroute Airlines",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/openroute_airlines.png"
  },
  {
    "id": "openskies_air",
    "name": "Openskies Air",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/openskies_air.png"
  },
  {
    "id": "purepath_air",
    "name": "Purepath Air",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/purepath_air.png"
  },
  {
    "id": "quickjet_air",
    "name": "Quickjet Air",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/quickjet_air.png"
  },
  {
    "id": "quickspan_airlines",
    "name": "Quickspan Airlines",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/quickspan_airlines.png"
  },
  {
    "id": "simplifly_air",
    "name": "Simplifly Air",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/simplifly_air.png"
  },
  {
    "id": "skipline_air",
    "name": "Skipline Air",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/skipline_air.png"
  },
  {
    "id": "sunpass_airlines",
    "name": "Sunpass Airlines",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/sunpass_airlines.png"
  },
  {
    "id": "truenorth_airlines",
    "name": "Truenorth Airlines",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/truenorth_airlines.png"
  },
  {
    "id": "valuejet",
    "name": "Valuejet",
    "group": "prestige-budget-lcc",
    "image": "/assets/logos/airlines/prestige-budget-lcc/valuejet.png"
  },
  {
    "id": "bespoke_airlines",
    "name": "Bespoke Airlines",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/bespoke_airlines.png"
  },
  {
    "id": "brilliance_airlines",
    "name": "Brilliance Airlines",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/brilliance_airlines.png"
  },
  {
    "id": "diamond_sky_airlines",
    "name": "Diamond Sky Airlines",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/diamond_sky_airlines.png"
  },
  {
    "id": "exquisite_airways",
    "name": "Exquisite Airways",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/exquisite_airways.png"
  },
  {
    "id": "finesse_air",
    "name": "Finesse Air",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/finesse_air.png"
  },
  {
    "id": "gilded_air",
    "name": "Gilded Air",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/gilded_air.png"
  },
  {
    "id": "gilded_sky_airlines",
    "name": "Gilded Sky Airlines",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/gilded_sky_airlines.png"
  },
  {
    "id": "gilt_airlines",
    "name": "Gilt Airlines",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/gilt_airlines.png"
  },
  {
    "id": "gloss_airlines",
    "name": "Gloss Airlines",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/gloss_airlines.png"
  },
  {
    "id": "grandeur_air",
    "name": "Grandeur Air",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/grandeur_air.png"
  },
  {
    "id": "haute_air",
    "name": "Haute Air",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/haute_air.png"
  },
  {
    "id": "lavish_airlines",
    "name": "Lavish Airlines",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/lavish_airlines.png"
  },
  {
    "id": "luminary_air",
    "name": "Luminary Air",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/luminary_air.png"
  },
  {
    "id": "lustrous_airways",
    "name": "Lustrous Airways",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/lustrous_airways.png"
  },
  {
    "id": "luxe_airways",
    "name": "Luxe Airways",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/luxe_airways.png"
  },
  {
    "id": "marquee_airways",
    "name": "Marquee Airways",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/marquee_airways.png"
  },
  {
    "id": "opulent_airways",
    "name": "Opulent Airways",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/opulent_airways.png"
  },
  {
    "id": "ornate_air",
    "name": "Ornate Air",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/ornate_air.png"
  },
  {
    "id": "platinum_wings",
    "name": "Platinum Wings",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/platinum_wings.png"
  },
  {
    "id": "posh_air",
    "name": "Posh Air",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/posh_air.png"
  },
  {
    "id": "refined_air",
    "name": "Refined Air",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/refined_air.png"
  },
  {
    "id": "resplendent_airways",
    "name": "Resplendent Airways",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/resplendent_airways.png"
  },
  {
    "id": "satin_air",
    "name": "Satin Air",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/satin_air.png"
  },
  {
    "id": "splendor_airways",
    "name": "Splendor Airways",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/splendor_airways.png"
  },
  {
    "id": "velvet_air",
    "name": "Velvet Air",
    "group": "luxury-ultra-premium",
    "image": "/assets/logos/airlines/luxury-ultra-premium/velvet_air.png"
  }
];
  // v1.1.11: support both direct game/index.html launch and web-server launch.
  // Root-relative /assets paths break under file:// by resolving to file://host/assets.
  AIRLINE_LOGOS.forEach(logo => {
    if (logo && typeof logo.image === 'string' && logo.image.startsWith('/assets/')) {
      logo.image = '..' + logo.image;
    }
  });
  const byId = new Map(AIRLINE_LOGOS.map(x => [x.id, x]));
  const DEFAULT_LOGO_ID = AIRLINE_LOGOS.some(x => x.id === 'nova_airlines') ? 'nova_airlines' : AIRLINE_LOGOS[0].id;
  function getAirlineLogo(id){ return byId.get(id) || byId.get(DEFAULT_LOGO_ID) || AIRLINE_LOGOS[0] || null; }
  function airlineLogoImg(id, className, alt){
    const logo=getAirlineLogo(id);
    if(!logo) return '<span class="ae-logo-fallback">✈</span>';
    const cls=className ? ' '+className : '';
    const safeAlt=String(alt || logo.name || 'Airline logo').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
    return '<img class="ae-airline-logo-img'+cls+'" src="'+logo.image+'" alt="'+safeAlt+'" loading="lazy" decoding="async">';
  }
  window.AIRLINE_LOGOS=AIRLINE_LOGOS;
  window.AIRLINE_LOGO_GROUPS=GROUP_LABELS;
  window.DEFAULT_AIRLINE_LOGO_ID=DEFAULT_LOGO_ID;
  window.getAirlineLogo=getAirlineLogo;
  window.airlineLogoImg=airlineLogoImg;
})();
