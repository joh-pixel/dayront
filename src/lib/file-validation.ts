/**
 * Maps a tool's slug or conversion pattern to its accepted input file extensions.
 */
export function getAllowedExtensions(slug: string, type: 'tool' | 'convert'): string[] {
  const s = slug.toLowerCase();

  // --- CONVERTERS (e.g., mp4-to-mp3) ---
  if (type === 'convert' && s.includes('-to-')) {
    const [source] = s.split('-to-');
    
    // Map source formats to their extensions
    const formatMap: Record<string, string[]> = {
      'mp3': ['mp3'],
      'wav': ['wav'],
      'mp4': ['mp4', 'm4v'],
      'flac': ['flac'],
      'm4a': ['m4a'],
      'mov': ['mov', 'qt'],
      'webm': ['webm'],
      'aac': ['aac'],
      'ogg': ['ogg', 'oga'],
      'opus': ['opus'],
      'avi': ['avi'],
      'mkv': ['mkv'],
      'aiff': ['aiff', 'aif'],
      'amr': ['amr'],
      'ape': ['ape'],
      'flv': ['flv']
    };

    if (formatMap[source]) return formatMap[source];
  }

  // --- TOOLS ---
  const toolMap: Record<string, string[]> = {
    'trim-audio-files-online-free': ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac'],
    'merge-audio-files-privacy-first': ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac'],
    'compress-audio-files-online-free': ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac'],
    'boost-audio-volume-online-free': ['mp3', 'wav', 'm4a'],
    'convert-stereo-to-mono-privacy-first': ['mp3', 'wav', 'm4a', 'flac'],
    'change-audio-speed-without-pitch-online': ['mp3', 'wav', 'm4a', 'flac'],
    'reverse-audio-files-online-free': ['mp3', 'wav', 'm4a'],
    'extract-audio-from-video-privacy-first': ['mp4', 'mov', 'mkv', 'avi', 'webm', 'flv'],
    'trim-video-files-online-free': ['mp4', 'mov', 'mkv', 'avi', 'webm'],
    'merge-video-files-privacy-first': ['mp4', 'mov', 'mkv', 'avi', 'webm'],
    'compress-video-files-online-free': ['mp4', 'mov', 'mkv', 'avi', 'webm'],
    'convert-video-to-gif-online-free': ['mp4', 'mov', 'mkv', 'avi', 'webm'],
    'convert-gif-to-video-privacy-first': ['gif'],
    'mute-video-audio-online-free': ['mp4', 'mov', 'mkv', 'avi', 'webm'],
    'crop-video-online-free': ['mp4', 'mov', 'mkv', 'avi', 'webm'],
    'resize-video-resolution-online-free': ['mp4', 'mov', 'mkv', 'avi', 'webm'],
    'change-video-fps-online-free': ['mp4', 'mov', 'mkv', 'avi', 'webm'],
    'burn-subtitles-into-video-privacy-first': ['mp4', 'mov', 'mkv', 'avi', 'webm'],
    'remove-background-from-image-ai-free': ['jpg', 'jpeg', 'png', 'webp'],
    'ai-photo-editor-online-free': ['jpg', 'jpeg', 'png', 'webp'],
    'generate-video-captions-ai-free': ['mp4', 'mov', 'mkv', 'avi', 'webm'],
    
    // Fallback for original tool names if you haven't renamed them yet
    'audio-cutter': ['mp3', 'wav', 'm4a', 'flac', 'ogg'],
    'audio-merger': ['mp3', 'wav', 'm4a', 'flac'],
    'audio-compressor': ['mp3', 'wav', 'm4a', 'flac'],
    'video-cutter': ['mp4', 'mov', 'mkv', 'avi'],
    'video-merger': ['mp4', 'mov', 'mkv', 'avi'],
    'extract-audio': ['mp4', 'mov', 'mkv', 'avi'],
    'video-to-gif': ['mp4', 'mov', 'mkv', 'avi'],
  };

  return toolMap[s] || ['mp3', 'mp4', 'wav', 'mov']; // Safe default
}

/**
 * Strictly validates a file against a list of allowed extensions.
 * Returns true if valid, false if invalid.
 */
export function isValidFile(file: File, allowedExtensions: string[]): boolean {
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split('.').pop() || '';
  
  // 1. Check Extension
  if (!allowedExtensions.includes(fileExtension)) {
    return false;
  }

  // 2. Basic MIME Type check (optional, but adds a layer of security)
  const mimeType = file.type.toLowerCase();
  if (mimeType && !mimeType.startsWith('audio/') && !mimeType.startsWith('video/') && !mimeType.startsWith('image/') && !mimeType.startsWith('application/octet-stream')) {
      // Allow octet-stream because some OSes don't correctly set MIME for .mkv or .flac
      return false;
  }

  return true;
}