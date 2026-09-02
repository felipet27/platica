// Migración única: corrige el desfase de zona horaria en transacciones ya
// guardadas. Las creadas con fecha "solo día" quedaron ancladas a MEDIANOCHE
// UTC (00:00:00.000Z), que en Colombia (UTC-5) se muestra como el día anterior
// y puede caer en el mes equivocado. Las reanclamos al MEDIODÍA UTC del mismo
// día calendario UTC, que es como se guardan ahora.
//
// Seguro e idempotente: solo toca filas cuya hora es exactamente 00:00:00.000
// UTC (las afectadas por el bug). Las que tienen hora real no se modifican.
//
// Uso:  node scripts/fix-transaction-dates.mjs         (aplica los cambios)
//       node scripts/fix-transaction-dates.mjs --dry   (solo muestra, no toca)
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const envContent = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
for (const line of envContent.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const [k, ...rest] = t.split("=");
  process.env[k.trim()] = rest.join("=").trim();
}
const mongoose = require("mongoose");

const DRY = process.argv.includes("--dry");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection;
  const transactions = db.collection("transactions");

  const all = await transactions.find({}).toArray();
  console.log(`Transacciones totales: ${all.length}`);

  let fixed = 0, skipped = 0;
  for (const t of all) {
    const d = new Date(t.date);
    const atUtcMidnight =
      d.getUTCHours() === 0 &&
      d.getUTCMinutes() === 0 &&
      d.getUTCSeconds() === 0 &&
      d.getUTCMilliseconds() === 0;

    if (!atUtcMidnight) {
      skipped++;
      continue;
    }

    const fixedDate = new Date(d);
    fixedDate.setUTCHours(12, 0, 0, 0);

    const before = d.toISOString();
    const after = fixedDate.toISOString();
    console.log(`  ${DRY ? "[dry] " : "✅ "}"${t.description}" ${before} → ${after}`);

    if (!DRY) {
      await transactions.updateOne({ _id: t._id }, { $set: { date: fixedDate } });
    }
    fixed++;
  }

  console.log(
    `\nResumen: ${fixed} ${DRY ? "se corregirían" : "corregidas"}, ${skipped} sin cambios.`
  );
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
