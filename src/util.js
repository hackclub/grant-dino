export function escapeRegex(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export const safetyNet = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (e) {
    console.error(e);
    res.writeHead(500);
    res.end("Something unexpectedly went wrong :(");
  }
};

export function isBankUrl(url) {
  return /bank\.hackclub\.com\/[a-zA-Z0-9\-_]+/i.test(url);
}

export function extractUrl(text) {
  // jank
  const match = text?.match(/[^\s<>\|]+\.[^\s<>\|]{2,}/);

  if (!match) return null;

  return match[0];
}
