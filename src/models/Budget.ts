import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  category: string;
  limit: number;
  createdAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, required: true },
    limit: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// Un solo presupuesto por usuario y categoría
BudgetSchema.index({ userId: 1, category: 1 }, { unique: true });

const Budget: Model<IBudget> =
  mongoose.models.Budget ?? mongoose.model<IBudget>("Budget", BudgetSchema);

export default Budget;
