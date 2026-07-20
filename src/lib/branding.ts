/**
 * Utility to replace all hardcoded occurrences of the default company name 'Taranet'
 * (and its uppercase/lowercase/combination variants) with the dynamically configured company name.
 */
export function replaceCompanyText(text: string, currentCompanyName: string = 'Taranet'): string {
  if (!text) return '';
  const cName = currentCompanyName || 'Taranet';
  if (cName.toLowerCase() === 'taranet') return text;

  let result = text;
  
  // Replace combined name variations first
  result = result.replace(/Taranet\s+WiFi/gi, cName);
  result = result.replace(/Taranet\s+Wifi/gi, cName);
  result = result.replace(/TARANET\s+WIFI/g, cName.toUpperCase());
  
  // Replace standalone name variations
  result = result.replace(/Taranet/g, cName);
  result = result.replace(/TARANET/g, cName.toUpperCase());
  
  // Special handling for domain names and lowercase references (avoid breaking system file paths or APIs)
  // Ensure we don't accidentally corrupt local filenames or assets if any
  result = result.replace(/taranet\.id/gi, `${cName.toLowerCase().replace(/\s+/g, '')}.id`);
  result = result.replace(/cs@taranet\.id/gi, `cs@${cName.toLowerCase().replace(/\s+/g, '')}.id`);
  result = result.replace(/admin@taranet\.id/gi, `admin@${cName.toLowerCase().replace(/\s+/g, '')}.id`);
  result = result.replace(/budi@taranet\.id/gi, `budi@${cName.toLowerCase().replace(/\s+/g, '')}.id`);
  
  return result;
}
