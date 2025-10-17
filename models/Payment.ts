import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    // Payment identification
    payment_id: {
      type: String,
      required: true,
      unique: true,
    },
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
    },

    // User reference
    userId: {
      type: String,
      required: true,
      ref: "User",
    },

    // User details (denormalized for performance)
    userFirstName: {
      type: String,
      required: true,
    },
    userLastName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    userPhone: {
      type: String,
      required: true,
    },
    userAddress: {
      type: String,
      required: true,
    },

    // Payment basic info
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentType: {
      type: String,
      enum: ["downpayment", "monthly", "cash", "full"],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "bank_transfer", "check"],
      required: true,
    },
    currency: {
      type: String,
      default: "PHP",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed",
    },

    // Design information
    designId: {
      type: String,
      required: false,
    },
    designName: {
      type: String,
      required: true,
    },
    designPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    squareMeters: {
      type: Number,
      required: true,
      min: 0,
    },
    isLoanOffer: {
      type: Boolean,
      default: false,
    },

    // Loan details (if applicable)
    loanDetails: {
      interestRate: {
        type: Number,
        min: 0,
        max: 100,
      },
      loanTerm: {
        type: Number,
        min: 0,
      },
      downPayment: {
        type: Number,
        min: 0,
      },
      monthlyPayment: {
        type: Number,
        min: 0,
      },
      totalLoanAmount: {
        type: Number,
        min: 0,
      },
      remainingBalance: {
        type: Number,
        min: 0,
      },
    },

    // Transaction details
    transactionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: false,
    },

    // Additional information
    notes: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
PaymentSchema.index({ userId: 1, transactionDate: -1 });
PaymentSchema.index({ referenceNumber: 1 });
PaymentSchema.index({ paymentType: 1 });
PaymentSchema.index({ status: 1 });

export default mongoose.models.Payment ||
  mongoose.model("Payment", PaymentSchema);
