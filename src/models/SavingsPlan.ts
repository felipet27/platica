import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISavingsPlan extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  monthlyContribution: number;
  category: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

const SavingsPlanSchema = new Schema<ISavingsPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, default: 0, min: 0 },
    targetDate: { type: Date, required: true },
    monthlyContribution: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: ["Emergencia", "Vacaciones", "Educación", "Retiro", "Vivienda", "Vehículo", "Otro"],
    },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SavingsPlan: Model<ISavingsPlan> =
  mongoose.models.SavingsPlan ??
  mongoose.model<ISavingsPlan>("SavingsPlan", SavingsPlanSchema);

export default SavingsPlan;
