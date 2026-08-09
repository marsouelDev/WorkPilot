import { z } from "zod";

export const ProjetSchema = z.object({
  titre: z.string().email("Email invalide"),
  descriptionSommaire: z
    .string()
    .min(
      20,
      "La description doit avor au moins 20 caractere pour pouvoir generer le cahier de charge et ses taches",
    ),
  depotGitUrl: z
    .string()
    .url("L'URL du dépôt Git est invalide")
    .optional()
    .or(z.literal("")),
});

export const InviteMemberSchema = z.object({
  email: z.string().email("Veuillez saisir une adresse email valide"),
});

export const changeRoleSchema = z.object({
  role: z.enum(["chef_projet", "developpeur", "relecteur"]),
});

export type ProjetFormSchema = z.infer<typeof ProjetSchema>;
export type InviteMemberFormSchema = z.infer<typeof InviteMemberSchema>;
export type changeRoleFormSchema = z.infer<typeof changeRoleSchema>;
