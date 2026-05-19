"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Banner = exports.BannerStatus = void 0;
const mongoose_1 = require("mongoose");
var BannerStatus;
(function (BannerStatus) {
    BannerStatus["ACTIVE"] = "ACTIVE";
    BannerStatus["INACTIVE"] = "INACTIVE";
})(BannerStatus || (exports.BannerStatus = BannerStatus = {}));
const bannerSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Banner title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    bannerImage: {
        type: String,
        required: [true, 'Banner image URL is required'],
        trim: true
    },
    startTime: {
        type: Date,
        required: [true, 'Start time is required'],
        index: true
    },
    endTime: {
        type: Date,
        required: [true, 'End time is required'],
        index: true
    },
    status: {
        type: String,
        enum: Object.values(BannerStatus),
        default: BannerStatus.ACTIVE,
        index: true
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret) => {
            const formatDate = (date) => {
                if (!date)
                    return null;
                const d = new Date(date);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                return `${day}-${month}-${year}`;
            };
            ret.startTime = formatDate(ret.startTime);
            ret.endTime = formatDate(ret.endTime);
            return ret;
        }
    },
    toObject: { virtuals: true }
});
// Indexes for common queries
bannerSchema.index({ status: 1, startTime: 1, endTime: 1, isDeleted: 1 });
exports.Banner = (0, mongoose_1.model)('Banner', bannerSchema);
