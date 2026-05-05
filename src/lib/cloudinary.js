// Cloudinary Configuration
// Free tier: 25GB storage, 25GB bandwidth/month
// Using WebM (VP9) format for maximum compression & bandwidth savings

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';

/**
 * Generate optimized Cloudinary video URL
 * Uses WebM/VP9 format + adaptive quality for maximum bandwidth savings
 * 
 * @param {string} publicId - Cloudinary public ID of the video
 * @param {object} options - Transformation options
 * @returns {string} Optimized video URL
 */
export function getVideoUrl(publicId, options = {}) {
  if (!CLOUDINARY_CLOUD_NAME) {
    console.warn('⚠️ VITE_CLOUDINARY_CLOUD_NAME not set. Video URLs will not work.');
    return '';
  }

  const {
    quality = 'auto:low',  // auto:low saves most bandwidth
    width = 854,           // 480p width (good enough for courses)
    format = 'webm',       // WebM VP9 = ~40% smaller than MP4
  } = options;

  // Build transformation string
  const transforms = [
    `q_${quality}`,
    `w_${width}`,
    `f_${format}`,
    'vc_vp9',              // Force VP9 codec for WebM
    'ac_opus',             // Opus audio codec (smaller than AAC)
  ].join(',');

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/${transforms}/${publicId}`;
}

/**
 * Generate video thumbnail URL from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {object} options - Options
 * @returns {string} Thumbnail URL
 */
export function getVideoThumbnail(publicId, options = {}) {
  if (!CLOUDINARY_CLOUD_NAME) return '';

  const {
    width = 800,
    height = 450,
    quality = 'auto:low',
  } = options;

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/w_${width},h_${height},c_fill,q_${quality},f_webp,so_2/${publicId}.jpg`;
}

/**
 * Generate image URL from Cloudinary (for course thumbnails)
 * @param {string} publicId - Cloudinary public ID
 * @param {object} options - Options
 * @returns {string} Optimized image URL
 */
export function getImageUrl(publicId, options = {}) {
  if (!CLOUDINARY_CLOUD_NAME) return '';

  const {
    width = 800,
    height = 450,
    quality = 'auto:low',
    format = 'webp',
  } = options;

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},h_${height},c_fill,q_${quality},f_${format}/${publicId}`;
}

/**
 * Bandwidth savings comparison (approximate):
 * 
 * 10-min video (1080p):
 *   MP4 H.264: ~150 MB
 *   WebM VP9 480p auto:low: ~15 MB  (90% savings!)
 * 
 * Cloudinary free: 25GB bandwidth/month
 * With WebM VP9 480p: ~1,600 video views/month (10-min each)
 * With MP4 1080p: ~166 video views/month
 * 
 * Recommendation: Upload original video to Cloudinary,
 * then serve via getVideoUrl() with WebM VP9 transformation.
 */

export default {
  getVideoUrl,
  getVideoThumbnail,
  getImageUrl,
  CLOUDINARY_CLOUD_NAME,
};
