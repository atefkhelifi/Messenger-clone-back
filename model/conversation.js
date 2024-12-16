const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ],
  lastMessageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  updatedAt: { type: Date, default: Date.now },
});
conversationSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

conversationSchema.set("toJSON", {
  virtuals: true,
});

module.exports = mongoose.model("Conversation", conversationSchema);
//exports.Conversation = mongoose.model("Conversation", conversationSchema);
//exports.conversationSchema = conversationSchema;
