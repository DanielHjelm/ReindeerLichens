import mongoose from "mongoose";
const { Schema } = mongoose;


const imageSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    original: {type: String ,required: true},
    mask : String,
    overlay: String,

    }
);

export default mongoose.model("Image", imageSchema);