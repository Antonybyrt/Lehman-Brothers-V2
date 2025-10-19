/**
 * Interface pour représenter un utilisateur avec des données formatées pour la vue
 */
export interface UserView {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
}

/**
 * Repository pour obtenir des vues enrichies d'utilisateurs
 * Sépare la responsabilité de formatage des données de la logique métier
 */
export interface UserViewRepository {
  /**
   * Récupère un utilisateur avec les données formatées pour la vue
   */
  findByIdAsView(userId: string): Promise<UserView | null>;

  /**
   * Récupère le nom complet d'un utilisateur
   */
  getFullNameById(userId: string): Promise<string | null>;

  /**
   * Récupère plusieurs utilisateurs avec leurs données formatées
   */
  findManyAsView(userIds: string[]): Promise<UserView[]>;
}
