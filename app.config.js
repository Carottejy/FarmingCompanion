// Le sous-chemin web (GitHub Pages : /FarmingCompanion) ne doit s'appliquer qu'à l'export web :
// appliqué aux builds natifs, il casse l'emplacement des assets dans l'app iOS/Android.
module.exports = ({ config }) => {
  const baseUrl = process.env.WEB_BASE_URL;
  if (!baseUrl) return config;
  return { ...config, experiments: { ...(config.experiments ?? {}), baseUrl } };
};
