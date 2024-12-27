const express = require("express");
const router = express.Router();
const Conversation = require("../model/conversation");
const Message = require("../model/message");

// Create a conversation and send a message
router.post("/create", async (req, res) => {
  const { participants, senderId, content } = req.body;

  if (!participants || !senderId || !content) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Step 1: Find an existing conversation with the same participants
    let conversation = await Conversation.findOne({
      participants: { $all: participants, $size: participants.length },
    });

    if (!conversation) {
      // Step 2: If no conversation exists, create a new one
      conversation = new Conversation({ participants });
      await conversation.save();
    }

    // Step 3: Create a new message
    const message = new Message({
      conversationId: conversation._id,
      senderId,
      content,
    });
    await message.save();

    // Step 4: Update the conversation
    conversation.lastMessageId = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    // Step 6: Respond with the conversation and message
    res.status(201).json({ conversation, message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a user's conversations and messages
router.get("/my-conversations/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Step 1: Find conversations involving the user
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "name email") // Populate user details (adjust fields as needed)
      .populate("lastMessageId", "content senderId createdAt") // Populate last message details
      .exec();

    if (!conversations.length) {
      return res
        .status(404)
        .json({ message: "No conversations found for this user." });
    }

    // Step 2: Reorder participants so the connected user is listed last
    const reorderedConversations = conversations.map((conversation) => {
      const reorderedParticipants = conversation.participants
        .filter((participant) => participant._id.toString() !== userId) // Exclude the connected user
        .concat(
          conversation.participants.find(
            (participant) => participant._id.toString() === userId
          )
        ); // Add the connected user last

      return {
        ...conversation.toObject(), // Convert the conversation to a plain object
        participants: reorderedParticipants, // Assign reordered participants
      };
    });

    // Step 3: Respond with the data
    res.status(200).json(reorderedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a specific conversation
router.get("/:conversationId", async (req, res) => {
  const { conversationId } = req.params;

  try {
    // Fetch messages by conversationId
    const messages = await Message.find({ conversationId })
      .sort({ timestamp: 1 }) // Sort by creation date (oldest first)
      .exec();

    // If no messages are found
    if (!messages.length) {
      return res
        .status(404)
        .json({ message: "No messages found for this conversation." });
    }

    // Respond with the messages
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: error.message });
  }
});
//Get a conversation by ID participants
router.get("/conversation/:idUsers", async (req, res) => {
  const { idUsers } = req.params;

  const participants = idUsers.split(",");
  console.log(participants);
  try {
    // Fetch conversation by ID
    const conversation = await Conversation.find({
      participants: { $all: [participants[0], participants[1]] },
      $expr: { $eq: [{ $size: "$participants" }, 2] }, // Ensure exactly 2 participants
    })
      .populate("participants", "name email") // Populate user details (adjust fields as needed)
      .populate("lastMessageId", "content senderId createdAt") // Populate last message details
      .exec();

    // If no conversation is found
    if (!conversation) {
      return res
        .status(404)
        .json({ message: "No conversation found with this ID." });
    }

    // Respond with the conversation
    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get participants in discussion by conversationId
router.get("/participants/:conversationId", async (req, res) => {
  const { conversationId } = req.params;

  try {
    // Fetch conversation by ID
    const conversation = await Conversation.findById(conversationId)
      .populate("participants", "name email") // Populate user details
      .exec();

    // If no conversation is found
    if (!conversation) {
      return res
        .status(404)
        .json({ message: "No conversation found with this ID." });
    }

    // Respond with the participants
    res.status(200).json(conversation.participants);
  } catch (error) {
    console.error("Error fetching participants:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
