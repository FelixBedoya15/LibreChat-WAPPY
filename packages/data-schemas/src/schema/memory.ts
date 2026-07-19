import { Schema } from 'mongoose';
import type { IMemoryEntry } from '~/types/memory';

const MemoryEntrySchema: Schema<IMemoryEntry> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  agentId: {
    type: String,
    default: 'global',
  },
  key: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => /^[a-z_]+$/.test(v),
      message: 'Key must only contain lowercase letters and underscores',
    },
  },
  value: {
    type: String,
    required: true,
  },
  tokenCount: {
    type: Number,
    default: 0,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for fast per-agent queries
MemoryEntrySchema.index({ userId: 1, agentId: 1 });

export default MemoryEntrySchema;

