import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params;
  const s = sizeParam === "512" ? 512 : 192;

  // Proporciones de la P (afinadas para que coincidan con el logo SVG)
  const pW  = Math.round(s * 0.44);   // ancho total de la P
  const pH  = Math.round(s * 0.60);   // alto total de la P
  const sw  = Math.round(s * 0.115);  // ancho del trazo vertical (stem)
  const bH  = Math.round(s * 0.335);  // alto del cuenco (bowl)
  const bR  = Math.round(bH / 2);     // radio del cuenco (D shape)

  // Counter interior del cuenco
  const cPad = Math.round(s * 0.065); // padding top/bottom del counter
  const cW   = Math.round(pW - sw - Math.round(s * 0.075));
  const cH   = Math.round(bH - cPad * 2);
  const cR   = Math.round(cH / 2);

  // Posición centrada del bloque P dentro del ícono
  const pLeft = Math.round((s - pW) / 2);
  const pTop  = Math.round((s - pH) / 2);

  return new ImageResponse(
    (
      <div
        style={{
          width: s,
          height: s,
          backgroundColor: "#16a34a",
          display: "flex",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Trazo vertical de la P */}
        <div
          style={{
            position: "absolute",
            left: pLeft,
            top: pTop,
            width: sw,
            height: pH,
            backgroundColor: "white",
            borderRadius: Math.round(sw * 0.25),
          }}
        />

        {/* Cuenco exterior — forma D */}
        <div
          style={{
            position: "absolute",
            left: pLeft,
            top: pTop,
            width: pW,
            height: bH,
            backgroundColor: "white",
            borderRadius: `0 ${bR}px ${bR}px 0`,
          }}
        />

        {/* Counter — recorta el interior del cuenco con el color del fondo */}
        <div
          style={{
            position: "absolute",
            left: pLeft + sw,
            top: pTop + cPad,
            width: cW,
            height: cH,
            backgroundColor: "#16a34a",
            borderRadius: `0 ${cR}px ${cR}px 0`,
          }}
        />
      </div>
    ),
    { width: s, height: s }
  );
}
