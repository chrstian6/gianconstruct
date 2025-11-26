import mongoose, { Schema, Document } from "mongoose";

export interface ITimelineEntry extends Document {
  project_id: string;
  type:
    | "project_created"
    | "project_confirmed"
    | "project_assigned"
    | "status_update"
    | "photo_timeline_update" // CHANGED from photo_update to photo_timeline_update
    | "milestone";
  title: string;
  description?: string;
  photoUrls?: string[];
  assignedTo?: string;
  progress?: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const timelineEntrySchema = new Schema(
  {
    project_id: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "project_created",
        "project_confirmed",
        "project_assigned",
        "status_update",
        "photo_timeline_update", // CHANGED from photo_update to photo_timeline_update
        "milestone",
      ],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    photoUrls: [
      {
        type: String,
      },
    ],
    assignedTo: {
      type: String,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret._id = ret._id.toString();
        ret.createdAt = ret.createdAt.toISOString();
        ret.updatedAt = ret.updatedAt.toISOString();
        delete ret.__v;
      },
    },
  }
);

// Ensure the model is recreated to apply the schema
delete mongoose.models.Timeline;
const TimelineModel =
  mongoose.models.Timeline ||
  mongoose.model<ITimelineEntry>("Timeline", timelineEntrySchema);
export default TimelineModel;
