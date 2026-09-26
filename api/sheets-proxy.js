// Vercel Serverless Function for proxying Google Sheets & Google Apps Script without CORS restrictions
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Parameter url diperlukan.' });
  }

  try {
    const decodedUrl = decodeURIComponent(url);

    // Allow google sheets, google apps script, and valid https urls
    if (!decodedUrl.startsWith('https://')) {
      return res.status(400).json({ error: 'URL tidak valid. Harus diawali dengan https://' });
    }

    if (req.method === 'POST') {
      // Forward POST request with JSON body to Apps Script
      const postBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      const response = await fetch(decodedUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        body: postBody
      });

      const responseText = await response.text();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).send(responseText);
    }

    // Default GET request
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Gagal mengambil data dari Google Sheets / Apps Script: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const responseData = await response.text();

    if (contentType.includes('application/json') || responseData.trim().startsWith('{') || responseData.trim().startsWith('[')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    } else {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    }

    return res.status(200).send(responseData);
  } catch (error) {
    console.error('Error proxying sheets/scripts:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memproses spreadsheet: ' + error.message });
  }
}
