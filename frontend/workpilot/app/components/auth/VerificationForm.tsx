"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, RotateCw, TimerReset } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuthStore } from "@/stores/authStore";

const RESEND_DELAY_SECONDS = 60;
const CODE_EXPIRY_SECONDS = 10 * 60;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function VerificationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [resendSecondsLeft, setResendSecondsLeft] =
    useState(RESEND_DELAY_SECONDS);
  const [expirySecondsLeft, setExpirySecondsLeft] =
    useState(CODE_EXPIRY_SECONDS);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const { verifyCode, resendCode, isLoading, error, clearError } =
    useAuthStore();

  const isExpired = expirySecondsLeft <= 0;

  useEffect(() => {
    if (resendSecondsLeft <= 0) return;

    const timer = setInterval(() => {
      setResendSecondsLeft((s) => s - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendSecondsLeft]);

  useEffect(() => {
    if (expirySecondsLeft <= 0) return;

    const timer = setInterval(() => {
      setExpirySecondsLeft((s) => s - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [expirySecondsLeft]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isExpired) return;

    try {
      await verifyCode({ email, code });
      router.push("/dashboard");
    } catch {}
  };

  const onResend = async () => {
    if (resendSecondsLeft > 0 || isResending) return;

    clearError();
    setResendMessage(null);
    setIsResending(true);

    try {
      await resendCode({ email });
      setResendSecondsLeft(RESEND_DELAY_SECONDS);
      setExpirySecondsLeft(CODE_EXPIRY_SECONDS);
      setCode("");
      setResendMessage("Un nouveau code vous a été envoyé.");
    } catch {
      // l'erreur est déjà exposée via useAuthStore().error
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <p className="text-center text-gray-500">
        Un code a été envoyé à{" "}
        <span className="font-semibold text-gray-900">{email}</span>
      </p>

      <div className="flex justify-center animate-fadeInUp [animation-delay:350ms]">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={setCode}
          disabled={isExpired}
        >
          <InputOTPGroup>
            <InputOTPSlot
              index={0}
              className="rounded-xl border-gray-300 h-14 w-12 text-lg focus:ring-2 focus:ring-indigo-500"
            />
            <InputOTPSlot
              index={1}
              className="rounded-xl border-gray-300 h-14 w-12 text-lg focus:ring-2 focus:ring-indigo-500"
            />
            <InputOTPSlot
              index={2}
              className="rounded-xl border-gray-300 h-14 w-12 text-lg focus:ring-2 focus:ring-indigo-500"
            />
            <InputOTPSlot
              index={3}
              className="rounded-xl border-gray-300 h-14 w-12 text-lg focus:ring-2 focus:ring-indigo-500"
            />
            <InputOTPSlot
              index={4}
              className="rounded-xl border-gray-300 h-14 w-12 text-lg focus:ring-2 focus:ring-indigo-500"
            />
            <InputOTPSlot
              index={5}
              className="rounded-xl border-gray-300 h-14 w-12 text-lg focus:ring-2 focus:ring-indigo-500"
            />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-sm animate-fadeInUp [animation-delay:400ms]">
        <TimerReset className="h-3.5 w-3.5 text-gray-400" />

        {isExpired ? (
          <span className="font-medium text-red-500">
            Le code a expiré, veuillez en demander un nouveau.
          </span>
        ) : (
          <span className="text-gray-400">
            Le code expire dans{" "}
            <span className="font-medium text-gray-600">
              {formatTime(expirySecondsLeft)}
            </span>
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || isExpired || code.length < 6}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Chargement...
          </>
        ) : (
          "Vérifier"
        )}
      </button>

      <div className="text-center text-sm">
        {resendMessage && (
          <p className="mb-2 text-emerald-600">{resendMessage}</p>
        )}

        {resendSecondsLeft > 0 ? (
          <p className="text-gray-400">
            Renvoyer le code dans{" "}
            <span className="font-medium text-gray-600">
              {resendSecondsLeft}s
            </span>
          </p>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={isResending}
            className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors disabled:opacity-60 disabled:no-underline"
          >
            {isResending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <RotateCw className="h-3.5 w-3.5" />
                Renvoyer le code
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-center text-sm text-red-500">{String(error)}</p>
      )}
    </form>
  );
}
