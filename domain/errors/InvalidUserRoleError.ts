export class InvalidUserRoleError extends Error {
  public constructor(public readonly role: string, public readonly validRoles: string[]) {
    super(`Invalid user role: ${role}. Valid roles are: ${validRoles.join(', ')}`);
    this.name = "InvalidUserRoleError";
  }
}
