import AuthCard from "@/app/components/auth/AuthCard";
import RegisterForm from "@/app/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthCard
      formTitle="Créez votre compte"
      panelTitle="Vous avez déjà un compte sur cette plateforme ?"
      panelDescription="Connectez-vous afin d'accéder à votre espace personnel et gérer toutes vos informations."
      ctaLabel="Se connecter"
      ctaHref="/login"
      bottomText="Vous avez déjà un compte ?"
      bottomLinkLabel="Se connecter"
      bottomLinkHref="/login"
    >
      <RegisterForm />
    </AuthCard>
  );
}
