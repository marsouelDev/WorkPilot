import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';

interface EmailData {
  code?: string;
  password?: string;
  nom?: string;
  statut?: 'actif' | 'suspendu';
  projetTitre?: string;
  projetId?: number;
  role?: string;
  ancienRole?: string;
  inviteurNom?: string;
  tacheTitre?: string;
  raison?: string;
}

@Injectable()
export class EmailService {
  constructor(private readonly mail: MailService) {}

  async envoyer(email: string, type: string, data?: EmailData | string) {
    const emailData: EmailData =
      typeof data === 'string' ? { code: data } : (data ?? {});
    if (type === 'code_verification') {
      return this.mail.sendMail(
        email,
        '🔐 Vérification de votre compte WorkPilot',
        `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Vérification WorkPilot</title>
</head>

<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0"
style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,.08);">

<tr>
<td
style="background:#6366f1;padding:35px;text-align:center;color:#fff;">
<h1 style="margin:0;">WorkPilot</h1>
<p style="margin-top:10px;font-size:16px;">
Bienvenue sur notre plateforme
</p>
</td>
</tr>

<tr>
<td style="padding:40px;">

<h2 style="color:#222;margin-top:0;">
Bonjour 👋
</h2>

<p style="color:#555;line-height:28px;">
Merci de vous être inscrit sur <strong>WorkPilot</strong>.
Pour activer votre compte, utilisez le code de vérification suivant :
</p>

<div
style="
margin:35px auto;
width:220px;
background:#6366f1;
color:white;
font-size:34px;
font-weight:bold;
text-align:center;
padding:18px;
border-radius:10px;
letter-spacing:10px;
">
${emailData.code}
</div>

<p
style="color:#666;text-align:center;font-size:15px;">
Ce code est valable pendant
<strong>10 minutes</strong>.
</p>

<hr style="margin:35px 0;border:none;border-top:1px solid #eee;">

<p style="color:#888;font-size:14px;line-height:24px;">
Si vous n'êtes pas à l'origine de cette inscription,
vous pouvez ignorer cet email mais ce code est valable pendant 10 minute.
</p>

</td>
</tr>

<tr>
<td
style="background:#f8fafc;padding:20px;text-align:center;color:#777;font-size:13px;">

© ${new Date().getFullYear()} WorkPilot<br>
Plateforme de gestion de projets et des taches.

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
      );
    }

    if (type === 'bienvenue') {
      return this.mail.sendMail(
        email,
        '🎉 Votre compte WorkPilot est activé',
        `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Bienvenue</title>
</head>

<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0"
style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,.08);">

<tr>
<td
style="background:#6366f1;padding:35px;text-align:center;color:#fff;">
<h1 style="margin:0;">🎉 Félicitations !</h1>
</td>
</tr>

<tr>
<td style="padding:40px;">

<h2 style="color:#222;margin-top:0;">
Bienvenue sur WorkPilot
</h2>

<p style="color:#555;line-height:28px;">
Votre compte a été vérifié avec succès.
Vous pouvez désormais accéder à toutes les fonctionnalités de la plateforme.
</p>

<div
style="
margin:35px 0;
background:#ecfdf5;
border-left:5px solid #16a34a;
padding:20px;
border-radius:8px;
">

<h3 style="margin-top:0;color:#16a34a;">
✅ Compte activé
</h3>

<p style="margin-bottom:0;color:#555;">
Votre adresse email a été confirmée avec succès.
</p>

</div>

<p style="color:#555;">
Merci de faire confiance à
<strong>WorkPilot</strong>.
</p>

<div style="text-align:center;margin-top:35px;">

<a href="#"
style="
background:#2563eb;
color:white;
text-decoration:none;
padding:15px 35px;
border-radius:8px;
font-weight:bold;
display:inline-block;
">
Se connecter
</a>

</div>

</td>
</tr>

<tr>
<td
style="background:#f8fafc;padding:20px;text-align:center;color:#777;font-size:13px;">

© ${new Date().getFullYear()} WorkPilot<br>
Plateforme de gestion de projets et de collaboration.

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
      );
    }

    if (type === 'code_verification_password') {
      return this.mail.sendMail(
        email,
        '🔐 Création de votre compte WorkPilot',
        `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Création de votre compte WorkPilot</title>
</head>

<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr>
<td align="center">

<table
width="600"
cellpadding="0"
cellspacing="0"
style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,.08);"
>

<tr>
<td
style="background:#6366f1;padding:35px;text-align:center;color:#ffffff;"
>
<h1 style="margin:0;">WorkPilot</h1>
<p style="margin:10px 0 0;">
Votre compte a été créé avec succès
</p>
</td>
</tr>

<tr>
<td style="padding:40px;">

<h2 style="margin-top:0;color:#222;">
Bonjour ${emailData.nom} 👋
</h2>

<p style="color:#555;line-height:28px;">
Un administrateur vient de créer votre compte WorkPilot.
Vous trouverez ci-dessous vos informations de connexion.
</p>

<div
style="
background:#f8fafc;
padding:20px;
border-radius:10px;
margin:25px 0;
border:1px solid #e5e7eb;
"
>

<p style="margin:0 0 15px;">
<strong>Email :</strong><br>
${email}
</p>

<p style="margin:0 0 10px;">
<strong>Mot de passe temporaire :</strong>
</p>

<div
style="
background:#111827;
color:white;
padding:15px;
text-align:center;
font-size:24px;
font-weight:bold;
border-radius:8px;
letter-spacing:3px;
"
>
${emailData.password}
</div>

</div>

<p style="color:#555;">
Votre code de vérification est :
</p>

<div
style="
margin:25px auto;
width:220px;
background:#6366f1;
color:white;
font-size:32px;
font-weight:bold;
text-align:center;
padding:18px;
border-radius:10px;
letter-spacing:8px;
"
>
${emailData.code}
</div>

<p
style="
color:#666;
text-align:center;
margin-top:20px;
"
>
Ce code est valable pendant <strong>10 minutes</strong>.
</p>

<div style="text-align:center;margin-top:35px;">

<a
href="http://localhost:3000/verification?email=${encodeURIComponent(email)}"
style="
background:#2563eb;
color:white;
text-decoration:none;
padding:15px 35px;
border-radius:8px;
font-weight:bold;
display:inline-block;
"
>
Vérifier mon compte
</a>

</div>

<p
style="
margin-top:30px;
color:#555;
line-height:26px;
"
>
Après avoir cliqué sur le bouton, saisissez le code de vérification reçu dans cet email afin d'activer votre compte.
</p>

<hr style="margin:35px 0;border:none;border-top:1px solid #eee;">

<p
style="
color:#888;
font-size:14px;
line-height:24px;
"
>
Pour votre sécurité, pensez à modifier votre mot de passe après votre première connexion.
</p>

</td>
</tr>

<tr>
<td
style="
background:#f8fafc;
padding:20px;
text-align:center;
color:#777;
font-size:13px;
"
>
© ${new Date().getFullYear()} WorkPilot<br>
Plateforme de gestion de projets et de tâches.
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
      );
    }

    if (type === 'statut') {
      const isActif = emailData.statut === 'actif';

      const subject = isActif
        ? '✅ Votre compte WorkPilot a été réactivé'
        : '⚠️ Votre compte WorkPilot a été suspendu';

      const title = isActif ? 'Compte réactivé' : 'Compte suspendu';

      const message = isActif
        ? 'Nous avons le plaisir de vous informer que votre compte WorkPilot a été réactivé. Vous pouvez à nouveau accéder à votre espace et utiliser toutes les fonctionnalités de la plateforme.'
        : 'Votre compte WorkPilot a été suspendu par un administrateur. Pendant cette période, vous ne pourrez plus accéder à votre compte.';

      const statusText = isActif ? '✅ Compte actif' : '⛔ Compte suspendu';

      const statusMessage = isActif
        ? 'Votre accès à WorkPilot est désormais rétabli.'
        : "Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre administrateur.";

      const color = isActif ? '#16a34a' : '#dc2626';

      const background = isActif ? '#ecfdf5' : '#fef2f2';

      return this.mail.sendMail(
        email,
        subject,
        `
<!DOCTYPE html>
<html lang="fr">

<head>
<meta charset="UTF-8">
<title>Statut du compte</title>
</head>


<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">


<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr>
<td align="center">


<table
width="600"
cellpadding="0"
cellspacing="0"
style="
background:#ffffff;
border-radius:12px;
overflow:hidden;
box-shadow:0 5px 20px rgba(0,0,0,.08);
">


<tr>

<td
style="
background:${color};
padding:35px;
text-align:center;
color:white;
">

<h1 style="margin:0;">
WorkPilot
</h1>

<p style="margin-top:10px;font-size:16px;">
${title}
</p>

</td>

</tr>



<tr>

<td style="padding:40px;">


<h2 style="margin-top:0;color:#222;">
Bonjour ${emailData.nom ?? ''} 👋
</h2>


<p style="color:#555;line-height:28px;">
${message}
</p>



<div
style="
margin:30px 0;
padding:20px;
border-radius:10px;
background:${background};
border-left:5px solid ${color};
">


<h3
style="
margin-top:0;
color:${color};
">
${statusText}
</h3>


<p style="margin-bottom:0;color:#555;">
${statusMessage}
</p>


</div>



<p style="color:#555;">
Merci d'utiliser <strong>WorkPilot</strong>.
</p>


</td>

</tr>



<tr>

<td
style="
background:#f8fafc;
padding:20px;
text-align:center;
color:#777;
font-size:13px;
">

© ${new Date().getFullYear()} WorkPilot<br>
Plateforme de gestion de projets et de tâches.

</td>

</tr>


</table>


</td>
</tr>
</table>


</body>

</html>
`,
      );
    }

    if (type === 'invitation_projet') {
      return this.mail.sendMail(
        email,
        `🎉 Vous êtes invité à rejoindre le projet "${emailData.projetTitre}"`,
        this.getInvitationTemplate(email, emailData),
      );
    }

    if (type === 'changement_role') {
      return this.mail.sendMail(
        email,
        `🔄 Votre rôle a été modifié sur le projet "${emailData.projetTitre}"`,
        this.getChangementRoleTemplate(email, emailData),
      );
    }

    // ⭐ NOUVEAU : Retrait d'un projet
    if (type === 'retrait_projet') {
      return this.mail.sendMail(
        email,
        `👋 Vous avez été retiré du projet "${emailData.projetTitre}"`,
        this.getRetraitTemplate(email, emailData),
      );
    }
  }

  // ⭐ Template pour l'invitation
  private getInvitationTemplate(email: string, data: EmailData): string {
    const roleLabels = {
      chef_projet: 'Chef de projet',
      developpeur: 'Développeur',
      relecteur: 'Relecteur technique',
    };

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Invitation Projet</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr>
<td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,.08);">

<tr>
<td style="background:#6366f1;padding:35px;text-align:center;color:#fff;">
<h1 style="margin:0;">🎉 Vous êtes invité !</h1>
<p style="margin-top:10px;font-size:16px;">WorkPilot - Nouveau projet</p>
</td>
</tr>

<tr>
<td style="padding:40px;">
<h2 style="color:#222;margin-top:0;">
Bonjour ${data.nom ?? ''} 👋
</h2>

<p style="color:#555;line-height:28px;">
<strong>${data.inviteurNom ?? "Quelqu'un"}</strong> vous a invité à rejoindre un projet sur WorkPilot.
</p>

<div style="background:#f8fafc;padding:20px;border-radius:10px;margin:25px 0;border:1px solid #e5e7eb;">
<p style="margin:0 0 15px;">
<strong>📋 Projet :</strong><br>
<span style="font-size:18px;color:#6366f1;font-weight:bold;">${data.projetTitre}</span>
</p>

<p style="margin:0 0 15px;">
<strong>🎭 Votre rôle :</strong><br>
<div style="text-align:center;margin-top:35px;"></div>
<span style="background:#6366f1;color:white;padding:8px 16px;border-radius:6px;font-weight:bold;">
${roleLabels[data.role as keyof typeof roleLabels] || data.role}
</span>
</p>
</div>

<p style="color:#555;line-height:28px;">
En tant que membre de ce projet, vous pourrez :
</p>

<ul style="color:#555;line-height:32px;">
<li>Consulter le cahier des charges</li>
<li>Choisir et réaliser des tâches</li>
<li>Collaborer avec l'équipe</li>
</ul>

<div style="text-align:center;margin-top:35px;">
<a href="http://localhost:3000/projets/${data.projetId}"
style="background:#6366f1;color:white;text-decoration:none;padding:15px 35px;border-radius:8px;font-weight:bold;display:inline-block;">
Voir le projet
</a>
</div>
</td>
</tr>

<tr>
<td style="background:#f8fafc;padding:20px;text-align:center;color:#777;font-size:13px;">
© ${new Date().getFullYear()} WorkPilot<br>
Plateforme de gestion de projets et de tâches.
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;
  }

  // ⭐ Template pour le changement de rôle
  private getChangementRoleTemplate(email: string, data: EmailData): string {
    const roleLabels = {
      chef_projet: 'Chef de projet',
      developpeur: 'Développeur',
      relecteur: 'Relecteur technique',
    };

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Changement de rôle</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr>
<td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,.08);">

<tr>
<td style="background:#f59e0b;padding:35px;text-align:center;color:#fff;">
<h1 style="margin:0;">🔄 Changement de rôle</h1>
<p style="margin-top:10px;font-size:16px;">${data.projetTitre}</p>
</td>
</tr>

<tr>
<td style="padding:40px;">
<h2 style="color:#222;margin-top:0;">
Bonjour ${data.nom ?? ''} 👋
</h2>

<p style="color:#555;line-height:28px;">
Votre rôle sur le projet <strong>"${data.projetTitre}"</strong> a été modifié.
</p>

<div style="background:#fef3c7;padding:20px;border-radius:10px;margin:25px 0;border-left:5px solid #f59e0b;">
<div style="display:flex;align-items:center;justify-content:space-around;margin:20px 0;">
<div style="text-align:center;">
<p style="margin:0;color:#666;font-size:14px;">Ancien rôle</p>
<p style="margin:10px 0 0;font-size:18px;font-weight:bold;color:#dc2626;">
${roleLabels[data.ancienRole as keyof typeof roleLabels] || data.ancienRole}
</p>
</div>
<div style="font-size:32px;color:#f59e0b;">→</div>
<div style="text-align:center;">
<p style="margin:0;color:#666;font-size:14px;">Nouveau rôle</p>
<p style="margin:10px 0 0;font-size:18px;font-weight:bold;color:#16a34a;">
${roleLabels[data.role as keyof typeof roleLabels] || data.role}
</p>
</div>
</div>
</div>

<p style="color:#555;line-height:28px;">
Vos permissions ont été mises à jour automatiquement.
</p>

<div style="text-align:center;margin-top:35px;">
<a href="http://localhost:3000/projets/${data.projetId}"
style="background:#f59e0b;color:white;text-decoration:none;padding:15px 35px;border-radius:8px;font-weight:bold;display:inline-block;">
Accéder au projet
</a>
</div>
</td>
</tr>

<tr>
<td style="background:#f8fafc;padding:20px;text-align:center;color:#777;font-size:13px;">
© ${new Date().getFullYear()} WorkPilot<br>
Plateforme de gestion de projets et de tâches.
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;
  }

  // ⭐ Template pour le retrait
  private getRetraitTemplate(email: string, data: EmailData): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Retrait du projet</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr>
<td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,.08);">

<tr>
<td style="background:#dc2626;padding:35px;text-align:center;color:#fff;">
<h1 style="margin:0;">👋 Retrait du projet</h1>
</td>
</tr>

<tr>
<td style="padding:40px;">
<h2 style="color:#222;margin-top:0;">
Bonjour ${data.nom ?? ''} 👋
</h2>

<p style="color:#555;line-height:28px;">
Nous vous informons que vous avez été retiré du projet <strong>"${data.projetTitre}"</strong>.
</p>

<div style="background:#fef2f2;padding:20px;border-radius:10px;margin:25px 0;border-left:5px solid #dc2626;">
<h3 style="margin-top:0;color:#dc2626;">⚠️ Accès révoqué</h3>
<p style="margin-bottom:0;color:#555;">
Vous n'avez plus accès à ce projet et ne pouvez plus consulter ses tâches ni son cahier des charges.
</p>
</div>

<p style="color:#555;line-height:28px;">
Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le chef de projet.
</p>
</td>
</tr>

<tr>
<td style="background:#f8fafc;padding:20px;text-align:center;color:#777;font-size:13px;">
© ${new Date().getFullYear()} WorkPilot<br>
Plateforme de gestion de projets et de tâches.
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;
  }
}
