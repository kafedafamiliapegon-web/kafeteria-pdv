"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function verificarLogin() {
      if (pathname === "/login") {
        setCarregando(false);
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/login");
        return;
      }

      setCarregando(false);
    }

    verificarLogin();
  }, [pathname, router]);

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07130d] text-white">
        <div className="text-center">
          <div className="text-6xl">☕</div>
          <p className="mt-4 text-green-100/70">Carregando Kafeteria PDV...</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}