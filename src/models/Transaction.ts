import mongoose, { Schema, Document, Model } from "mongoose";
export { CATEGORIES } from "@/lib/categories";

export type TransactionType = "income" | "expense";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  tags: string[];
  date: Date;
  commitmentId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    tags: [{ type: String, trim: true }],
    date: { type: Date, required: true, default: Date.now },
    commitmentId: { type: Schema.Types.ObjectId, ref: "Commitment", default: null },
  },
  { timestamps: true }
);

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ??
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
