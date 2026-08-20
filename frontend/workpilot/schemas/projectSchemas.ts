import { z } from "zod";

export const ProjetSchema = z.object({
  titre: z.string().min(1, "Le titre du projet est obligatoire"),

  description: z
    .string()
    .min(
      20,
      "Décrivez votre besoin en au moins 20 caractères pour que l'IA puisse l'exploiter",
    ),
});

export type ProjetFormData = z.infer<typeof ProjetSchema>;

export const InviteMemberSchema = z.object({
  email: z.string().email("Veuillez saisir une adresse email valide"),
});

export const changeRoleSchema = z.object({
  role: z.enum(["chef_projet", "developpeur", "relecteur"]),
});

export type ProjetFormSchema = z.infer<typeof ProjetSchema>;
export type InviteMemberFormSchema = z.infer<typeof InviteMemberSchema>;
export type changeRoleFormSchema = z.infer<typeof changeRoleSchema>;
