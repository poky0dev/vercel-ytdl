const { YtDlp, helpers } = require('ytdlp-nodejs');

const API_KEY = 'Nyxahcute1';

let ytdlp;

module.exports = async (req, res) => {
  // CORS liberado para todos
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Somente GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed. Use GET.'
    });
  }

  // API key pela query
  const key = req.query.key;

  if (!key || key !== API_KEY) {
    return res.status(401).json({
      error: 'Invalid or missing API key'
    });
  }

  try {
    // Inicializa o yt-dlp
    if (!ytdlp) {
      const binaryPath = await helpers.downloadYtDlp();

      ytdlp = new YtDlp({
        binaryPath
      });
    }

    let videoUrl = req.query.url;
    const outputFormat =
      (req.query.format || 'mp4').toLowerCase();

    if (!videoUrl) {
      return res.status(400).json({
        error: 'Missing YouTube video ID or URL'
      });
    }

    // Aceita ID ou URL
    if (
      !videoUrl.startsWith('http://') &&
      !videoUrl.startsWith('https://')
    ) {
      videoUrl =
        `https://www.youtube.com/watch?v=${videoUrl}`;
    }

    // Formatos permitidos
    if (!['mp3', 'm4a', 'mp4'].includes(outputFormat)) {
      return res.status(400).json({
        error: 'Format must be mp3, m4a or mp4'
      });
    }

    let stream;

    if (outputFormat === 'mp4') {
      stream = ytdlp
        .stream(videoUrl)
        .filter('audioandvideo')
        .quality('highest')
        .type('mp4');

      res.setHeader('Content-Type', 'video/mp4');
    }

    if (outputFormat === 'm4a') {
      stream = ytdlp
        .stream(videoUrl)
        .filter('audioonly')
        .quality(5)
        .type('m4a');

      res.setHeader('Content-Type', 'audio/mp4');
    }

    if (outputFormat === 'mp3') {
      stream = ytdlp
        .stream(videoUrl)
        .filter('audioonly')
        .quality(5)
        .type('mp3');

      res.setHeader('Content-Type', 'audio/mpeg');
    }

    // Reproduzir no navegador em vez de forçar download
    res.setHeader(
      'Content-Disposition',
      `inline; filename="video.${outputFormat}"`
    );

    const outputStream = stream.getStream();

    outputStream.on('error', (error) => {
      console.error('yt-dlp stream error:', error);

      if (!res.headersSent) {
        res.status(500).json({
          error: 'Failed to process video',
          details: error.message
        });
      } else {
        res.end();
      }
    });

    outputStream.pipe(res);

  } catch (error) {
    console.error('YouTube error:', error);

    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Failed to process video',
        details: error.message
      });
    }
  }
};
