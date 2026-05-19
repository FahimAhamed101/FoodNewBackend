import { Schema, model, Document, Types } from 'mongoose';

export enum MealTokenStatus {
    AVAILABLE = 'available',
    CLAIMED = 'claimed',
}

export interface IMealToken extends Document {
    tokenId: string;
    donorUserId: Types.ObjectId;
    donationOrderId: Types.ObjectId;
    mealCount: number;
    pricePerMeal: number;
    platformFee: number;
    stateTax: number;
    totalPaid: number;
    status: MealTokenStatus;
    claimedByUserId?: Types.ObjectId;
    claimedAt?: Date;
    claimedOrderId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const mealTokenSchema = new Schema<IMealToken>(
    {
        tokenId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        donorUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        donationOrderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        mealCount: {
            type: Number,
            required: true,
            min: 1,
        },
        pricePerMeal: {
            type: Number,
            required: true,
            default: 5.99,
        },
        platformFee: {
            type: Number,
            required: true,
            default: 0,
        },
        stateTax: {
            type: Number,
            required: true,
            default: 0,
        },
        totalPaid: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(MealTokenStatus),
            default: MealTokenStatus.AVAILABLE,
            index: true,
        },
        claimedByUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        claimedAt: {
            type: Date,
            default: null,
        },
        claimedOrderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            default: null,
        },
    },
    { timestamps: true }
);

mealTokenSchema.index({ status: 1, createdAt: -1 });
mealTokenSchema.index({ donorUserId: 1, status: 1 });
mealTokenSchema.index({ claimedByUserId: 1, claimedAt: -1 });

export const MealToken = model<IMealToken>('MealToken', mealTokenSchema);
