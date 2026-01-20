const accentOptions = [
  {
    background: "#49c5b1",
    foreground: "#eeeeee",
  },
  {
    background: "#5eaeff",
    foreground: "#ff26ff",
  },
  {
    background: "#e3229f",
    foreground: "#ffe600",
  },
  {
    background: "#81b595",
    foreground: "#094a21",
  },
  {
    background: "#c78bd6",
    foreground: "#0590a6",
  },
];

export const getRandomAccent = () => {
  const option = accentOptions[Math.floor(Math.random() * accentOptions.length)];
  return {
    background: option.background,
    foreground: option.foreground,
  };
};

export const luminanace = (r, g, b) => {
  let a = [r, g, b].map(function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

export const contrast = (hex1, hex2, converter) => {
  if (!converter) return 0;
  let rgb1 = converter.hex.rgb(hex1);
  let rgb2 = converter.hex.rgb(hex2);
  let lum1 = luminanace(rgb1[0], rgb1[1], rgb1[2]);
  let lum2 = luminanace(rgb2[0], rgb2[1], rgb2[2]);
  let brightest = Math.max(lum1, lum2);
  let darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

export const getTransparentColor = (hex, transparency) => {
  if (!hex) return "";
  const hexVal = hex.replace("#", "");
  const r = parseInt(hexVal.slice(0, 2), 16);
  const g = parseInt(hexVal.slice(2, 4), 16);
  const b = parseInt(hexVal.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${transparency || 0.5})`;
};

export const parseColor = (color) => {
  if (typeof color === "string" || color instanceof String) {
    color = color.replace("#", "");
    color = color.replace("0x", "");
  }
  return parseInt(color, 16);
};

export const isLight = (color) => {
  color = parseColor(color);
  let r = (color >> 16) & 0xff;
  let g = (color >> 8) & 0xff;
  let b = (color >> 0) & 0xff;
  let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 128;
};

export const offsetColor = (color, amount) => {
  if (isLight(color)) {
    amount = amount * -1;
  }
  color = parseColor(color);
  var r = (color >> 16) + amount;
  var b = ((color >> 8) & 0x00ff) + amount;
  var g = (color & 0x0000ff) + amount;
  var newColor = g | (b << 8) | (r << 16);
  return "#" + newColor.toString(16);
};

export const isValidColorString = (str) => {
  const reg = /^#[0-9A-F]{6}$/i;
  return reg.test(str);
};
