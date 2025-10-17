// src/cloudinary/cloudinary.service.ts (CORRIGÉ)

import { Injectable, Inject } from '@nestjs/common';
import {
  v2 as cloudinaryV2,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary'; // 💡 ALIAS ICI
import { CLOUDINARY } from './cloudinary.provider';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  // 💡 Correction du typage : on utilise l'alias et le type Cloudinary de l'import
  constructor(
    @Inject(CLOUDINARY) private cloudinaryClient: typeof cloudinaryV2,
  ) {}

  /**
   * Upload un fichier (buffer) vers Cloudinary
   */
  async uploadFile(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const uploadOptions = { folder: 'resachap/resources' };

      const uploadStream = this.cloudinaryClient.uploader.upload_stream(
        // 💡 Utilisation de l'instance injectée
        uploadOptions,
        (error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Extrait le Public ID de Cloudinary à partir de l'URL pour la suppression.
   */
  private extractPublicId(url: string): string | null {
    if (!url) return null;
    const parts = url.split('/');
    // S'assurer que le dernier segment est bien l'image avec l'extension
    const fileNameWithExtension = parts.pop();
    if (!fileNameWithExtension) return null;

    // Récupérer le dossier (le 2e dernier segment) si nécessaire, sinon utiliser uniquement le public ID.
    // Cloudinary utilise souvent le dossier + ID, ex: folder/image_id
    const folder = 'resachap/resources'; // On force le dossier pour la suppression
    const publicId = fileNameWithExtension.split('.')[0];

    // Cloudinary exige le 'public ID' qui est généralement 'dossier/nom_du_fichier_sans_extension'
    return `${folder}/${publicId}`;
  }

  /**
   * Supprime une image de Cloudinary via son URL.
   */
  async deleteFileByUrl(imageUrl: string): Promise<void> {
    const publicId = this.extractPublicId(imageUrl);
    if (!publicId) return;

    try {
      // Supprimer du Cloudinary
      await this.cloudinaryClient.uploader.destroy(publicId); // 💡 Utilisation de l'instance injectée
      console.log(`Cloudinary: Image ${publicId} supprimée avec succès.`);
    } catch (error) {
      console.error(
        `Cloudinary: Échec de la suppression de ${publicId}.`,
        error,
      );
      // Nous ne lançons pas d'erreur pour ne pas bloquer la suppression de la DB
    }
  }
}
