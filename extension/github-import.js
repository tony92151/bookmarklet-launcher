export async function loadGithubScript(link, fetchScript = fetch) {
  let url;
  try {
    url = new URL(String(link).trim());
  } catch {
    throw new Error('Enter a GitHub link to a .js file.');
  }

  const parts = url.pathname.split('/').filter(Boolean);
  if (
    url.protocol !== 'https:' || url.hostname !== 'github.com' ||
    url.username || url.password || parts.length < 5 || parts[2] !== 'blob' ||
    !/^[\w.-]+$/.test(parts[0]) || !/^[\w.-]+$/.test(parts[1]) ||
    !parts.at(-1).endsWith('.js')
  ) {
    throw new Error('Enter a GitHub link to a .js file.');
  }

  const rawUrl = `https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${parts.slice(3).join('/')}`;
  let response;
  try {
    response = await fetchScript(rawUrl);
  } catch {
    throw new Error('Unable to load the GitHub file. Check your connection and try again.');
  }
  if (!response.ok) throw new Error(`Unable to load the GitHub file (HTTP ${response.status}).`);

  const code = await response.text();
  if (!code.trim()) throw new Error('The GitHub file is empty.');
  return { name: parts.at(-1).slice(0, -3), code };
}
