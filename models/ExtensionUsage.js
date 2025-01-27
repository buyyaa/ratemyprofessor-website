import mongoose from "mongoose";

const extensionUsageSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        scansThisMonth: {
            type: Number,
            default: 0
        },
        lastScanDate: {
            type: Date
        },
        monthlyReset: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Reset scans monthly
extensionUsageSchema.methods.resetIfNewMonth = async function() {
    const now = new Date();
    if (now > this.monthlyReset) {
        this.scansThisMonth = 0;
        this.monthlyReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        await this.save();
    }
};

export default mongoose.models.ExtensionUsage || mongoose.model("ExtensionUsage", extensionUsageSchema); 