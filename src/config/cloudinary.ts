// Cloudinary Configuration
// To use this, you need to:
// 1. Create a Cloudinary account at https://cloudinary.com/
// 2. Go to Dashboard to get your cloud name
// 3. Go to Settings > Upload > Add upload preset (unsigned)
// 4. Replace the values below with your actual Cloudinary credentials

export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: 'dusnwegeq', // Replace with your actual cloud name
  UPLOAD_PRESET: '3TShop_TTTN_2025', // Replace with your actual upload preset
  get API_URL() {
    return `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/image/upload`;
  }
};

// For production, you should use environment variables:
// Create a .env file in the root directory with:
// VITE_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
// VITE_CLOUDINARY_UPLOAD_PRESET=your_actual_upload_preset

// Then uncomment these lines and comment out the hardcoded values above:
// export const CLOUDINARY_CONFIG = {
//   CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
//   UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'your_upload_preset',
//   get API_URL() {
//     return `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/image/upload`;
//   }
// };
