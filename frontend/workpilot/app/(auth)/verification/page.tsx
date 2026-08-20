import { Mail } from "lucide-react";
import VerificationForm from "@/app/components/auth/VerificationForm";

export default function VerificationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-10 md:p-14 animate-fadeInUp">
        <div className="mb-6 flex justify-center animate-fadeInUp">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#6366F1]/10">
            <Mail className="h-8 w-8 text-[#6366F1]" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Vérification
        </h1>

        <VerificationForm />
      </div>
    </div>
  );
}
