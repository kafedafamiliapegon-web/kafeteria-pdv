"use client";

import Link from "next/link";

type HeaderProps = {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
};

export default function Header({
  title,
  subtitle = "Kafeteria PDV",
  backTo = "/",
  backLabel = "Voltar ao início",
}: HeaderProps) {
  return (
    <header className="pdv-hero mb-5">
      <div>
        <div className="pdv-hero-small">{subtitle}</div>

        <h1 className="pdv-hero-title">{title}</h1>

        <p className="pdv-hero-text">
          Visual premium integrado ao painel principal.
        </p>
      </div>

      <div className="pdv-hero-info">
        <Link href={backTo} className="pdv-info-card no-underline">
          <div className="pdv-info-label">{backLabel}</div>
          <div className="pdv-info-muted">Retornar com segurança</div>
        </Link>

        <div className="pdv-info-card">
          <div className="pdv-info-label">Sistema ativo</div>
          <div className="pdv-info-muted">Kafeteria em operação</div>
        </div>
      </div>
    </header>
  );
}