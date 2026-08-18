import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommitment extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  isActive: boolean;
}

const CommitmentSchema = new Schema<ICommitment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ["income", "expense"], required: true },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Commitment: Model<ICommitment> =
  mongoose.models.Commitment ??
  mongoose.model<ICommitment>("Commitment", CommitmentSchema);

export default Commitment;
