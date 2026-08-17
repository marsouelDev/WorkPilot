import ProfileOverview from "@/app/components/profile/ProfileOverview";
import UpdateUserForm from "@/app/components/profile/UpdateUserForm";
import ChangePassword from "@/app/components/profile/ChangePassword";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      {/* ======================================================
          APERÇU DU PROFIL (bannière + avatar)
      ====================================================== */}

      <ProfileOverview />

      {/* ======================================================
          FORMULAIRES (infos perso + sécurité)
      ====================================================== */}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <UpdateUserForm />
        <ChangePassword />
      </div>
    </div>
  );
}
