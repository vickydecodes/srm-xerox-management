import mongoose from "mongoose";
import { Branch } from "@db/models/branch.model.ts";
import { ENV } from "@config/env.config.ts";

async function seedBranches() {
  await mongoose.connect(ENV.MONGO_URI as string); // wait for connection first
  console.log("Connected to MongoDB");

  for (let i = 1; i < 11; i++) {
    const branch = new Branch({
      name: `Branch ${i}`,
      code: String(i).padStart(3, "0"),
    });
    await branch.save();
  }

  console.log("Seeded 10 branches");
  await mongoose.disconnect();
}

seedBranches().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});