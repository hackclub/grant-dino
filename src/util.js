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

export function extractBankSlug(url) {
  try {
    return url.match(/hcb\.hackclub\.com\/([a-zA-Z0-9\-_]+)/i)[1];
  } catch (e) {
    return null;
  }
}

export function extractUrl(text) {
  // jank
  const match = text?.match(/[^\s<>\|]+\.[^\s<>\|]{2,}/);

  if (!match) return null;

  return match[0];
}

export function coolSite(text) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/hackclub/css@79ee8661dfe9ab17af7d35cd8d9d7373029a8919/theme.css"
    />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/hackclub/css@79ee8661dfe9ab17af7d35cd8d9d7373029a8919/fonts.css"
    />
  </head>
  <body
    style="
      margin: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    "
  >
    <div class="card sunken" style="max-width: var(--size-narrow)">
      <p style="font-size: var(--font-3);">${text}</p>
    </div>
  </body>
</html>`;
}
