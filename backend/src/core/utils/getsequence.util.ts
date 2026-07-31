import { Counter } from '@db/models/counter.model.js';

export async function getNextSequence(key: string) {
  const seq = await Counter.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return seq.value;
}
