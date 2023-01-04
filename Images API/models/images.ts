
// Not used anymore but saved here for later reference
import mongoose from "mongoose";
const { Schema } = mongoose;

const imageSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  length: { type: Number },
  original: { type: String, trim: true, searchable: true },
  mask: { type: String, trim: true, searchable: true },
  overlay: { type: String, trim: true, searchable: true },
});

export default mongoose.model("Image", imageSchema);
