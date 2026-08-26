const cle = (projetId: number, userId: number) =>
  `wp-draft-${projetId}-${userId}`;

export function sauvegarderDraft(
  projetId: number,
  userId: number,
  modified: Record<string, string>,
) {
  if (Object.keys(modified).length === 0) {
    localStorage.removeItem(cle(projetId, userId));
    return;
  }
  localStorage.setItem(cle(projetId, userId), JSON.stringify(modified));
}

export function chargerDraft(
  projetId: number,
  userId: number,
): Record<string, string> | null {
  const raw = localStorage.getItem(cle(projetId, userId));
  return raw ? JSON.parse(raw) : null;
}

export function supprimerDraft(projetId: number, userId: number) {
  localStorage.removeItem(cle(projetId, userId));
}
