import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),

  password: z.string().min(8, "Minimum 8 caractères"),
});

export const registerSchema = z
  .object({
    nom: z.string().min(1, "Le nom est requis"),
    prenom: z.string().min(1, "Le prénom est requis"),
    email: z.string().email("Email invalide"),
    telephone: z.string().min(1, "Le téléphone est requis"),
    motDePasse: z.string().min(8, "8 caractères minimum"),
    confirmationMotDePasse: z.string(),
  })
  .refine((data) => data.motDePasse === data.confirmationMotDePasse, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmationMotDePasse"],
  });

export const updateSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  telephone: z.string().min(1, "Le téléphone est requis"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type updateFormData = z.infer<typeof updateSchema>;
