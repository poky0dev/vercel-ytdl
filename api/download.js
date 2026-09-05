const { YTDLP } = require('ytdlp-nodejs');

const ytdlp = new YTDLP();

module.exports = async (req, res) => {
  let videoUrl = req.query.url;
  const outputFormat = (req.query.format || 'mp4').toLowerCase();

  if (!videoUrl) {
    return res.status(400).json({
      error: 'Missing YouTube video ID or URL'
    });
  }

  // Aceita ID ou URL
  if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
    videoUrl = `https://www.youtube.com/watch?v=${videoUrl}`;
  }

  if (!['mp3', 'm4a', 'mp4'].includes(outputFormat)) {
    return res.status(400).json({
      error: 'Format must be mp3, m4a or mp4'
    });
  }

  try {
    let stream;

    if (outputFormat === 'mp4') {
      stream = ytdlp.stream(videoUrl, {
        format: 'best[ext=mp4]/best'
      });

      res.setHeader('Content-Type', 'video/mp4');
    }

    if (outputFormat === 'm4a') {
      stream = ytdlp.stream(videoUrl, {
        format: 'bestaudio[ext=m4a]/bestaudio'
      });

      res.setHeader('Content-Type', 'audio/mp4');
    }

    if (outputFormat === 'mp3') {
      stream = ytdlp.stream(videoUrl, {
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: '0'
      });

      res.setHeader('Content-Type', 'audio/mpeg');
    }

    res.setHeader(
      'Content-Disposition',
      `inline; filename="video.${outputFormat}"`
    );

    stream.on('error', (error) => {
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

    stream.pipe(res);

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
