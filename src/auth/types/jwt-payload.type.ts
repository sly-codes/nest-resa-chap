
// 🚨 NOUVEAU TYPE DE RÔLE :
export type UserRole = 'SUPER_ADMIN' | 'LOCATEUR' | 'LOCATAIRE';

// Le payload de base inclus dans les deux tokens (AT et RT)
export type JwtPayload = {
  id: string; // L'ID de l'utilisateur
  email: string; // 💡 AJOUT : Le rôle de l'utilisateur
  role: UserRole;
};

