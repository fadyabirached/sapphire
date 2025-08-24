const fs    = require('fs').promises;
const axios = require('axios');

const HF_MODEL = process.env.HF_MODEL || 'Falconsai/nsfw_image_detection';
const HF_TOKEN = process.env.HF_TOKEN || '';
const HF_URL   = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
const TIMEOUT  = 20000;

// treat any of these labels as spam
const BAD = ['sexy', 'porn', 'hentai', 'nsfw', 'xxx'];

module.exports = async function spamCheckHF(req, res, next) {
  if (!req.file) return next();

  try {
    const bytes = await fs.readFile(req.file.path);

    const { data } = await axios.post(
      HF_URL,
      bytes,
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/octet-stream'
        },
        timeout: TIMEOUT
      }
    );
    console.log('[HF] raw →', data);

    // data is an array of { label, score }
    const top = Array.isArray(data) ? data[0] : null;
    const isSpam = top &&
                   BAD.includes(top.label.toLowerCase()) &&
                   top.score >= 0.3;   // lowered to 0.3 for stricter catch

    if (isSpam) {
      await fs.unlink(req.file.path).catch(() => {});
      console.log('[HF] BLOCKED:', top.label, top.score);
      return res.status(422).json({ error: 'Image classified as spam.' });
    }

    console.log('[HF] ALLOWED:', top?.label, top?.score);
    next();
  } catch (err) {
    console.error('[HF] ERROR', err.response?.status || '', err.response?.data || err.message);
    // fail‑closed: block the post if HF is unreachable
    await fs.unlink(req.file.path).catch(() => {});
    res.status(503).json({ error: 'Spam detector unavailable' });
  }
};
