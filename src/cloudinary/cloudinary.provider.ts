import { ConfigService } from '@nestjs/config';
import { v2 } from 'cloudinary';

// Clé d'injection pour le client Cloudinary
export const CLOUDINARY = 'Cloudinary';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  useFactory: (config: ConfigService) => {
    // La configuration lit les variables d'environnement.
    v2.config({
      cloud_name: config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: config.get<string>('CLOUDINARY_API_SECRET'),
    });
    return v2;
  },
  inject: [ConfigService],
};
