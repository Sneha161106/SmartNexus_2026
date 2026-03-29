const mongoose = require("mongoose");

const approvalSchema = new mongoose.Schema(
  {
    stepId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["approved", "rejected"],
      required: true
    },
    comment: {
      type: String,
      trim: true,
      default: ""
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const receiptSchema = new mongoose.Schema(
  {
    fileName: String,
    originalName: String,
    mimeType: String,
    size: Number,
    path: String,
    url: String
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    convertedAmount: {
      type: Number,
      required: true,
      min: 0
    },
    companyCurrency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      default: null
    },
    currentStep: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    approvals: {
      type: [approvalSchema],
      default: []
    },
    receipt: {
      type: receiptSchema,
      default: null
    },
    ocrData: {
      merchant: String,
      total: Number,
      date: String,
      categoryHint: String,
      rawText: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Expense", expenseSchema);
