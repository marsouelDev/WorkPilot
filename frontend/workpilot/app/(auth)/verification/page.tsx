import VerificationForm from "@/app/components/auth/VerificationForm";

export default function VerificationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-10 md:p-14 animate-fadeInUp">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Vérification
        </h1>

        <VerificationForm />
      </div>
    </div>
  );
}
