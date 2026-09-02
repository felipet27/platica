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

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection;
  const user = await db.collection("users").findOne({ email: "felipet27@gmail.com" });
  console.log("Usuario:", user?._id?.toString(), user?.email);
  const uid = user._id;

  console.log("\n=== COMMITMENTS variables ===");
  const vars = await db.collection("commitments").find({ userId: uid, expenseType: "variable" }).toArray();
  for (const c of vars) {
    console.log(`- "${c.name}" $${c.amount} cat=${c.category} month=${c.month} type=${c.type} expenseType=${c.expenseType} _id=${c._id}`);
    const linked = await db.collection("transactions").find({ commitmentId: c._id }).toArray();
    console.log(`    transacciones vinculadas: ${linked.length}`, linked.map((t) => `${t.description}/$${t.amount}/${t.date?.toISOString?.().slice(0,10)}`));
  }

  console.log("\n=== Últimas 8 transacciones ===");
  const txs = await db.collection("transactions").find({ userId: uid }).sort({ date: -1 }).limit(8).toArray();
  for (const t of txs) {
    console.log(`- ${t.date?.toISOString?.().slice(0,10)} "${t.description}" $${t.amount} ${t.type} commitmentId=${t.commitmentId ?? "—"}`);
  }

  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
