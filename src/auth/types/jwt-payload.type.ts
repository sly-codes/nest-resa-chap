// Le payload de base inclus dans les deux tokens (AT et RT)
export type JwtPayload = {
  id: string; // L'ID de l'utilisateur (Locateur)
  email: string;
};
