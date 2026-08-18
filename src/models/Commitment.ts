import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommitment extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  type: "income" | "expense";
  incomeType?: "fixed" | "variable";
  frequency?: "monthly" | "biweekly";
  category: string;
  isActive: boolean;
  payDay?: number;
  totalInstallments?: number;
  installmentsPaid?: number;
}

const CommitmentSchema = new Schema<ICommitment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ["income", "expense"], required: true },
    incomeType: { type: String, enum: ["fixed", "variable"], default: "fixed" },
    frequency: { type: String, enum: ["monthly", "biweekly"], default: "monthly" },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    payDay: { type: Number, min: 1, max: 31, default: null },
    totalInstallments: { type: Number, min: 1, default: null },
    installmentsPaid: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

const Commitment: Model<ICommitment> =
  mongoose.models.Commitment ??
  mongoose.model<ICommitment>("Commitment", CommitmentSchema);

export default Commitment;
