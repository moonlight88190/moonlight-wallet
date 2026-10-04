import React, { useState, useRef, useCallback } from "react";
import { Eye, EyeOff, Copy, Check, Wifi, Sparkles, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { CountryFlag } from "@/components/AssetComponents";
import { formatMoney } from "@/lib/currency";
import { toast } from "sonner";

export interface TitaniumCard3DProps {
  balance: number;
  currency: string;
  walletCode?: string | undefined;
  countryCode?: string | undefined;
  regionLabel?: string | undefined;
  cardholderName?: string | undefined;
  tierName?: string | undefined;
  showPrivacyToggle?: boolean | undefined;
  interactive?: boolean | undefined;
  className?: string | undefined;
  onCurrencySelect?: ((code: string) => void) | undefined;
  currencyOptions?: Array<{ code: string; flag: string }> | undefined;
}

/**
 * World-class 3D Titanium & Obsidian luxury card component with
 * real-time cursor parallax tilt, dynamic holographic specular reflections,
 * EMV chip styling, and balance privacy controls.
 */
export function TitaniumCard3D({
  balance,
  currency,
  walletCode,
  countryCode = "US",
  regionLabel = "Global Treasury",
  cardholderName = "Moonlight Member",
  tierName = "TITANIUM NOCTURNE",
  showPrivacyToggle = true,
  interactive = true,
  className = "",
  onCurrencySelect,
  currencyOptions,
}: TitaniumCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Subtle, high-end calibrated 3D tilt (max ~10-12 deg)
      const rotX = -((y - centerY) / centerY) * 11;
      const rotY = ((x - centerX) / centerX) * 11;

      setRotateX(rotX);
      setRotateY(rotY);

      // Light reflections follow mouse
      setGlarePosition({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
        opacity: 0.85,
      });
    },
    [interactive],
  );

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  }, []);

  const handlePointerEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!walletCode) return;
    navigator.clipboard.writeText(walletCode);
    setCopied(true);
    toast.success("Wallet ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`relative mx-auto w-full select-none ${className}`}
      style={{ perspective: "1200px" }}
    >
      {/* 3D Card Shell */}
      <div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        className="group relative overflow-hidden rounded-[26px] p-6 sm:p-7 text-white transition-all will-change-transform cursor-pointer"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`,
          transition: isHovered
            ? "transform 0.12s ease-out, box-shadow 0.25s ease"
            : "transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.65s ease",
          boxShadow: isHovered
            ? "0 28px 60px -14px rgba(0, 0, 0, 0.75), 0 0 40px -10px rgba(0, 242, 170, 0.18)"
            : "0 18px 45px -12px rgba(0, 0, 0, 0.6), 0 0 24px -10px rgba(0, 0, 0, 0.4)",
          background: "linear-gradient(135deg, #131722 0%, #0d1017 50%, #080a0f 100%)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
        }}
      >
        {/* Brushed Metal Texture Overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 2px)`,
          }}
          aria-hidden="true"
        />

        {/* Dynamic Holographic Specular Reflection */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: glarePosition.opacity,
            background: `radial-gradient(circle 320px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.28) 0%, rgba(0, 242, 170, 0.12) 30%, rgba(59, 130, 246, 0.08) 55%, transparent 75%)`,
          }}
          aria-hidden="true"
        />

        {/* Holographic Iridescent Ribbon */}
        <div
          className="pointer-events-none absolute -inset-y-12 -inset-x-24 -rotate-12 opacity-[0.14] mix-blend-color-dodge transition-transform duration-700"
          style={{
            background: `linear-gradient(105deg, transparent 20%, rgba(0,242,170,0.4) 38%, rgba(59,130,246,0.5) 50%, rgba(245,158,11,0.4) 62%, transparent 80%)`,
            transform: `translateX(${(glarePosition.x - 50) * 1.5}%)`,
          }}
          aria-hidden="true"
        />

        {/* Ambient Top Rim Highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent"
          aria-hidden="true"
        />

        {/* ─── Card Header: Brand, Tier, & Contactless ─── */}
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.25)]" />
            <div>
              <div className="text-[11px] font-bold tracking-[0.28em] text-white/95 uppercase leading-none">
                MOONLIGHT
              </div>
              <div className="text-[8px] font-semibold tracking-[0.2em] text-gold/90 uppercase leading-none mt-0.5">
                {tierName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 backdrop-blur-md">
              <CountryFlag code={countryCode} size="xs" circle />
              <span className="text-[10px] font-medium tracking-wide text-white/80">
                {regionLabel}
              </span>
            </div>
            <Wifi className="h-4 w-4 rotate-90 text-white/60" strokeWidth={2.2} />
          </div>
        </div>

        {/* ─── Card Center: EMV Gold Chip & Balance ─── */}
        <div className="relative z-10 my-5 sm:my-6 space-y-3">
          <div className="flex items-center justify-between">
            {/* EMV Microchip Graphic */}
            <div className="flex h-8 w-11 items-center justify-center rounded-md border border-amber-300/40 bg-gradient-to-br from-amber-200/30 via-amber-400/20 to-amber-600/30 p-1 shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 border border-amber-300/20 rounded-md" />
              <div className="grid grid-cols-3 grid-rows-2 h-full w-full gap-[1.5px] opacity-70">
                <div className="border-r border-b border-amber-200/50" />
                <div className="border-r border-b border-amber-200/50" />
                <div className="border-b border-amber-200/50" />
                <div className="border-r border-amber-200/50" />
                <div className="border-r border-amber-200/50" />
                <div />
              </div>
            </div>

            {/* Privacy Toggle */}
            {showPrivacyToggle && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBalance(!showBalance);
                }}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer touch-manipulation backdrop-blur-sm"
              >
                {showBalance ? (
                  <>
                    <EyeOff className="h-3 w-3" />
                    <span className="hidden sm:inline">Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" />
                    <span className="hidden sm:inline">Reveal</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Balance Numerical Display */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/50 block">
              Available Liquidity
            </span>
            <div className="flex items-baseline gap-2">
              <h2
                className={`font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-white tabular drop-shadow-md transition-all duration-300 ${
                  showBalance ? "filter-none opacity-100" : "blur-md select-none opacity-60"
                }`}
              >
                {showBalance ? formatMoney(balance, currency) : "••••••••••••"}
              </h2>
              <span className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                {currency}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Card Footer: Cardholder Name, Wallet ID, & Hologram ─── */}
        <div className="relative z-10 flex items-end justify-between border-t border-white/10 pt-3">
          <div className="space-y-0.5">
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
              Account Holder
            </div>
            <div className="text-xs font-semibold tracking-wider text-white/90 uppercase font-sans">
              {cardholderName}
            </div>
          </div>

          {walletCode ? (
            <button
              type="button"
              onClick={handleCopyCode}
              className="group/code flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 px-3 py-1.5 transition-all cursor-pointer backdrop-blur-md active:scale-95"
            >
              <span className="font-mono text-xs font-semibold tracking-widest text-white/95">
                {walletCode}
              </span>
              {copied ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3 text-white/60 group-hover/code:text-white transition-colors" />
              )}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-white/70">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-[11px] font-mono">256-Bit Ledger</span>
            </div>
          )}
        </div>

        {/* Optional Currency Switcher Pills in Footer */}
        {currencyOptions && currencyOptions.length > 0 && onCurrencySelect && (
          <div className="relative z-10 flex items-center gap-1.5 pt-3.5 border-t border-white/10 mt-3 overflow-x-auto scrollbar-none">
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 shrink-0">
              Currency:
            </span>
            {currencyOptions.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCurrencySelect(opt.code);
                }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                  currency === opt.code
                    ? "bg-white text-black shadow-xs scale-105"
                    : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                }`}
              >
                <CountryFlag code={opt.flag} size="xs" circle />
                <span>{opt.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
