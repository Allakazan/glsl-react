
/**
 * Converts a hexadecimal color value to an RGB object.
 * @param hex The hexadecimal color value (e.g., 0xFF0000 for red).
 * @returns An object with r, g, and b properties.
 */
function hexToRgb(hex: number) {
  return {
    r: (hex >> 16) & 0xff,
    g: (hex >> 8) & 0xff,
    b: hex & 0xff,
  };
}

/**
 * Converts RGB color values to a hexadecimal number.
 * @param r The red component (0-255).
 * @param g The green component (0-255).
 * @param b The blue component (0-255).
 * @returns The hexadecimal color value.
 */
function rgbToHex(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b;
}

/**
 * Converts RGB color values to HSL (Hue, Saturation, Lightness).
 * @param r The red component (0-255).
 * @param g The green component (0-255).
 * @param b The blue component (0-255).
 * @returns An object with h, s, and l properties, where each value is between 0 and 1.
 */
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h, s, l };
}

/**
 * Converts HSL (Hue, Saturation, Lightness) color values to RGB.
 * @param h The hue component (0-1).
 * @param s The saturation component (0-1).
 * @param l The lightness component (0-1).
 * @returns An object with r, g, and b properties, where each value is between 0 and 255.
 */
function hslToRgb(h: number, s: number, l: number) {
  function hue2rgb(p: number, q: number, t: number) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}


/**
 * Converts a hexadecimal color string (e.g., "#FF0000") to a hexadecimal number.
 * Throws an error if the string does not start with '#'.
 * @param str The hexadecimal color string.
 * @returns The hexadecimal color value.
 */
export function hexStringToHex(str: string): number {
  if (!str.startsWith('#')) {
    throw new Error('Hex string must start with #');
  }
  return Number('0x' + str.slice(1));
}

/**
 * Converts a hexadecimal color number to a hexadecimal color string (e.g., "#FF0000").
 * @param hex The hexadecimal color value.
 * @returns The hexadecimal color string.
 */
export function hexToHexString(hex: number): string {
  return (
    '#' +
    hex
      .toString(16)
      .padStart(6, '0')
      .toLowerCase()
  );
}

/**
 * Brightens a hexadecimal color by a given amount.
 * @param hex The hexadecimal color value.
 * @param amount The amount to brighten (0-1).
 * @returns The new hexadecimal color value.
 */
export function brighten(hex: number, amount: number): number {
  const { r, g, b } = hexToRgb(hex);

  return rgbToHex(
    Math.min(255, r + 255 * amount),
    Math.min(255, g + 255 * amount),
    Math.min(255, b + 255 * amount)
  );
}


/**
 * Darkens a hexadecimal color by a given amount.
 * @param hex The hexadecimal color value.
 * @param amount The amount to darken (0-1).
 * @returns The new hexadecimal color value.
 */
export function darken(hex: number, amount: number): number {
  const { r, g, b } = hexToRgb(hex);

  return rgbToHex(
    Math.max(0, r - 255 * amount),
    Math.max(0, g - 255 * amount),
    Math.max(0, b - 255 * amount)
  );
}

/**
 * Saturates a hexadecimal color by a given amount.
 * @param hex The hexadecimal color value.
 * @param amount The amount to saturate (0-1).
 * @returns The new hexadecimal color value.
 */
export function saturate(hex: number, amount: number): number {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);

  hsl.s = Math.min(1, hsl.s + amount);

  const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Desaturates a hexadecimal color by a given amount.
 * @param hex The hexadecimal color value.
 * @param amount The amount to desaturate (0-1).
 * @returns The new hexadecimal color value.
 */
export function desaturate(hex: number, amount: number): number {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);

  hsl.s = Math.max(0, hsl.s - amount);

  const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}