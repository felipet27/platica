interface Props {
  variant?: "icon" | "wordmark" | "full";
  size?: "sm" | "md" | "lg" | "xl";
  textColor?: string;
  className?: string;
}

const SIZES = {
  sm:  { iconPx: 26,  textCls: "text-xl",   gapCls: "gap-2"   },
  md:  { iconPx: 34,  textCls: "text-2xl",  gapCls: "gap-2.5" },
  lg:  { iconPx: 44,  textCls: "text-3xl",  gapCls: "gap-3"   },
  xl:  { iconPx: 56,  textCls: "text-4xl",  gapCls: "gap-3.5" },
};

export function PlaticaLogo({
  variant = "full",
  size = "md",
  textColor = "#111827",
  className = "",
}: Props) {
  const { iconPx, textCls, gapCls } = SIZES[size];

  const Icon = (
    <svg
      width={iconPx}
      height={iconPx}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="20" cy="20" r="20" fill="#16a34a" />
      {/*
        P geométrica en espacio negativo:
        - Trazo vertical: x 12–16, y 11–29
        - Contorno exterior del cuenco: cuadrática hasta x≈26 y de regreso
        - Contra (counter interior): cuadrática más pequeña, fill-rule evenodd la recorta
      */}
      <path
        d="M 12 11 L 12 29 L 16 29 L 16 23 Q 28 23 28 16 Q 28 11 16 11 Z
           M 16 15 Q 23 15 23 17.5 Q 23 21 16 21 Z"
        fill="white"
        fillRule="evenodd"
      />
    </svg>
  );

  const Wordmark = (
    <span
      className={`font-bold tracking-tight leading-none select-none ${textCls}`}
      style={{ color: textColor }}
    >
      Platíca
    </span>
  );

  if (variant === "icon")     return <>{Icon}</>;
  if (variant === "wordmark") return <>{Wordmark}</>;

  return (
    <span className={`inline-flex items-center ${gapCls} ${className}`}>
      {Icon}
      {Wordmark}
    </span>
  );
}
