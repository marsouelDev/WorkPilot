import CreateUserForm from "@/app/components/users/createUsers";
import UsersListes from "@/app/components/users/usersListe";

export default function CreateUser() {
  return (
    <>
      <CreateUserForm></CreateUserForm>
      <UsersListes></UsersListes>
    </>
  );
}
