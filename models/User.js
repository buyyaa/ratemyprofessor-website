import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// USER SCHEMA
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      private: true,
    },
    image: {
      type: String,
    },
    // Used in the Stripe webhook to identify the user in Stripe and later create Customer Portal or prefill user credit card details
    customerId: {
      type: String,
      validate(value) {
        return value.includes("cus_");
      },
    },
    // Used in the Stripe webhook. should match a plan in config.js file.
    priceId: {
      type: String,
      validate(value) {
        return value.includes("price_");
      },
    },
    // Used to determine if the user has access to the product—it's turn on/off by the Stripe webhook
    hasAccess: {
      type: Boolean,
      default: false,
    },
    subscriptionTier: {
      type: String,
      enum: ['free', 'premium', 'pro'],
      default: 'free'
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'unpaid'],
      default: 'active'
    },
    extensionApiKey: {
      type: String,
      unique: true,
      sparse: true
    },
    tokens: {
      type: Number,
      default: 20  // Start with 20 tokens
    },
    totalTokensUsed: {
      type: Number,
      default: 0
    },
    lastTokenRefillDate: {
      type: Date,
      default: Date.now
    },
    monthlyTokenAllowance: {
      type: Number,
      default: 20  // Free tier monthly tokens
    },
    lastTokenRefreshDate: {
      type: Date,
      default: Date.now
    },
    purchasedTokens: {
      type: Number,
      default: 0  // Track separately purchased tokens
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);

export default mongoose.models.User || mongoose.model("User", userSchema);
