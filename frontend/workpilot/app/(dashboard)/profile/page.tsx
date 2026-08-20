import ProfileOverview from "@/app/components/profile/ProfileOverview";
import UpdateUserForm from "@/app/components/profile/UpdateUserForm";
import ChangePassword from "@/app/components/profile/ChangePassword";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <ProfileOverview />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <UpdateUserForm />
        <ChangePassword />
      </div>
    </div>
  );
}
