const ytdl = require('ytdl-core');

module.exports = async (req, res) => {
  let videoUrl = req.query.url;
  const outputFormat = (req.query.format || 'mp4').toLowerCase();

  if (!videoUrl) {
    return res.status(400).json({
      error: 'Missing YouTube video ID or URL'
    });
  }

  // Aceita ID ou URL
  if (!ytdl.validateURL(videoUrl)) {
    videoUrl = `https://www.youtube.com/watch?v=${videoUrl}`;
  }

  if (!ytdl.validateURL(videoUrl)) {
    return res.status(400).json({
      error: 'Invalid YouTube URL or ID'
    });
  }

  if (!['mp3', 'm4a', 'mp4'].includes(outputFormat)) {
    return res.status(400).json({
      error: 'Format must be mp3, m4a or mp4'
    });
  }

  try {
    const info = await ytdl.getInfo(videoUrl);

    // MP4
    if (outputFormat === 'mp4') {
      const format = ytdl.chooseFormat(info.formats, {
        quality: '18',
        container: 'mp4'
      });

      if (!format) {
        return res.status(404).json({
          error: 'MP4 format not found'
        });
      }

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader(
        'Content-Disposition',
        'inline; filename="video.mp4"'
      );

      return ytdl(videoUrl, { format }).pipe(res);
    }

    // M4A
    if (outputFormat === 'm4a') {
      const format = ytdl.chooseFormat(info.formats, {
        quality: 'highestaudio',
        filter: 'audioonly',
        container: 'm4a'
      });

      if (!format) {
        return res.status(404).json({
          error: 'M4A format not found'
        });
      }

      res.setHeader('Content-Type', 'audio/mp4');
      res.setHeader(
        'Content-Disposition',
        'inline; filename="nyxah-audio-api.m4a"'
      );

      return ytdl(videoUrl, { format }).pipe(res);
    }

    // MP3 requires FFmpeg
    return res.status(501).json({
      error: 'MP3 conversion requires FFmpeg'
    });

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
