import { createRequire } from "module";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Carga variables de .env.local manualmente
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...rest] = trimmed.split("=");
  process.env[key.trim()] = rest.join("=").trim();
}

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI || MONGODB_URI.includes("<usuario>")) {
  console.error("❌ Configura MONGODB_URI en .env.local antes de ejecutar este script.");
  process.exit(1);
}

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    twoFactorEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Conectado a MongoDB");

  const User = mongoose.models.User ?? mongoose.model("User", UserSchema);

  const email = "felipet27@gmail.com";
  const passwordPlain = "abc123*";
  const name = "Felipe";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`⚠️  El usuario ${email} ya existe. Actualizando contraseña...`);
    existing.password = await bcrypt.hash(passwordPlain, 12);
    await existing.save();
    console.log("✅ Contraseña actualizada.");
  } else {
    const hashed = await bcrypt.hash(passwordPlain, 12);
    await User.create({ name, email, password: hashed });
    console.log(`✅ Usuario creado: ${email}`);
  }

  console.log("\n  Usuario:    felipet27@gmail.com");
  console.log("  Contraseña: abc123*\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
