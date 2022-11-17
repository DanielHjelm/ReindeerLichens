import mongoose from "mongoose";
const { Schema } = mongoose;


const imageSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    original: String,
    mask : String,
    overlay: String,

    }
);

export default mongoose.model("Image", imageSchema);