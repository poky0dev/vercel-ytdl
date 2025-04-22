const ytdl = require('ytdl-core');

module.exports = async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl || !ytdl.validateURL(videoUrl)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const info = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(info.formats, { quality: '18' }); // mp4 360p (reliable)

    res.setHeader('Content-Disposition', `attachment; filename="video.mp4"`);
    ytdl(videoUrl, { format }).pipe(res);
  } catch (error) {
    console.error('Download error:', error.message);
    res.status(500).json({ error: 'Failed to download video' });
  }
};
