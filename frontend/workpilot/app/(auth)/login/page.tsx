import AuthCard from "@/app/components/auth/AuthCard";
import LoginForm from "@/app/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthCard
      formTitle="Bienvenue sur votre espace"
      panelTitle="Vous n'avez pas de compte cette plateforme ?"
      panelDescription="Inscrivez-vous afin d'accéder à votre espace personnel et gérer toutes vos informations."
      ctaLabel="S'inscrire"
      ctaHref="/register"
      bottomText="Vous n'avez pas de compte ?"
      bottomLinkLabel="S'inscrire"
      bottomLinkHref="/register"
    >
      <LoginForm />
    </AuthCard>
  );
}
