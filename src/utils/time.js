export function parseWindow(windowStr) {
  if (!windowStr) throw new Error('Window string is required');

  const match = /^(\d+)\s*([smhd])$/i.exec(windowStr.trim());
  if (!match) {
    throw new Error(
      `Invalid window format: "${windowStr}". Expected format: "60s", "5m", "1h", or "1d"`
    );
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const multipliers = {
    's': 1000,              // seconds
    'm': 60 * 1000,         // minutes
    'h': 60 * 60 * 1000,    // hours
    'd': 24 * 60 * 60 * 1000 // days
  };

  if (!multipliers[unit]) {
    throw new Error(`Unsupported time unit: "${unit}"`);
  }

  return value * multipliers[unit];
}
