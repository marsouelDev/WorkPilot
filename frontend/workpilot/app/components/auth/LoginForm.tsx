"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2 } from "lucide-react";
import { LoginFormData } from "@/types/authTypes";
import { loginSchema } from "@/schemas/authSchemas";
import { useAuthStore } from "@/stores/authStore";
import { zodResolver } from "@hookform/resolvers/zod";

export default function LoginForm() {
  const { login, isLoading } = useAuthStore();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login({
        email: data.email,
        password: data.password,
      });

      router.push("/dashboard");
    } catch {}
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="animate-fadeInUp [animation-delay:350ms]">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Adresse Email
        </label>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            type="email"
            placeholder="exemple@email.com"
            {...register("email")}
            className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:scale-[1.02] transition-all duration-200"
          />
        </div>

        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="animate-fadeInUp [animation-delay:450ms]">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mot de passe
        </label>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="********"
            {...register("password")}
            className="w-full rounded-xl border border-gray-300 pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:scale-[1.02] transition-all duration-200"
          />

          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-indigo-600 hover:scale-110 transition-all duration-200"
          >
            {showPassword ? (
              <svg
                key="eye-off"
                className="animate-iconPop"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                key="eye-on"
                className="animate-iconPop"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {errors.password && (
          <p className="mt-1 text-sm text-red-500">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 animate-fadeInUp [animation-delay:550ms] disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Chargement...
          </>
        ) : (
          "Se connecter"
        )}
      </button>
    </form>
  );
}