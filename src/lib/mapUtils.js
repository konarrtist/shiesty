export const getMapImageUrl = (mapName) => {
  // Safe string conversion for localized objects or nulls
  const raw = (typeof mapName === 'object' && mapName?.en) ? mapName.en : (typeof mapName === 'string' ? mapName : '');
  const name = raw.toLowerCase();
  if (name.includes('stella') || name.includes('ridge')) return 'https://i.ibb.co/XkNwj78R/Stella-Tile.webp';
  if (name.includes('spaceport') || name.includes('shuttle')) return 'https://i.ibb.co/4bmDsL7/Spaceport-Tile.webp';
  if (name.includes('dam') || name.includes('reservoir')) return 'https://i.ibb.co/Rp7Y0WwL/Dam-Battlegrounds-Tile.webp';
  if (name.includes('gate') || name.includes('delta')) return 'https://i.ibb.co/GQYPtJKk/Blue-Gate-Tile.webp';
  return 'https://i.ibb.co/H1QgKqJ/Buried-City-Tile.webp';
};
