const mongoose = require("mongoose");

const workflowStepSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      trim: true,
      default: ""
    },
    label: {
      type: String,
      required: true,
      trim: true
    },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { _id: true }
);

const workflowSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    threshold: {
      type: Number,
      default: 0,
      min: 0
    },
    conditionType: {
      type: String,
      enum: ["sequential", "percentage", "specific", "hybrid"],
      default: "sequential"
    },
    approvalPercentage: {
      type: Number,
      default: null,
      min: 1,
      max: 100
    },
    specificApproverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    steps: {
      type: [workflowStepSchema],
      default: []
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Workflow", workflowSchema);
