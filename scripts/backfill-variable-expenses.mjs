// Backfill: crea la transacción vinculada para gastos variables (expenseType
// "variable") que se registraron antes de que existiera la sincronización
// automática. Idempotente: no toca los que ya tienen transacción vinculada.
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

// Misma lógica que src/lib/commitments.ts
function dateForMonth(month) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return new Date();
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (month === currentYM) return now;
  return new Date(`${month}-15T12:00:00`);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection;
  const commitments = db.collection("commitments");
  const transactions = db.collection("transactions");

  const vars = await commitments.find({ type: "expense", expenseType: "variable" }).toArray();
  console.log(`Gastos variables encontrados: ${vars.length}`);

  let created = 0, skipped = 0;
  for (const c of vars) {
    const existing = await transactions.countDocuments({ commitmentId: c._id });
    if (existing > 0) {
      skipped++;
      continue;
    }
    await transactions.insertOne({
      userId: c.userId,
      type: "expense",
      amount: c.amount,
      category: c.category,
      description: c.name,
      tags: [],
      date: dateForMonth(c.month),
      commitmentId: c._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    created++;
    console.log(`  ✅ Transacción creada para "${c.name}" ($${c.amount}, ${c.month})`);
  }

  console.log(`\nResumen: ${created} creadas, ${skipped} ya tenían transacción.`);
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
