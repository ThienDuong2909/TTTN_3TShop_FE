export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: 'dusnwegeq', // Replace with your actual cloud name
  UPLOAD_PRESET: '3TShop_TTTN_2025', // Replace with your actual upload preset
  get API_URL() {
    return `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/image/upload`;
  }
};
