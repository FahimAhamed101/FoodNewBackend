"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const banner_model_1 = require("../models/banner.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
class BannerService {
    createBanner(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (data.startTime && typeof data.startTime === 'string') {
                const [day, month, year] = data.startTime.split('-').map(Number);
                data.startTime = new Date(year, month - 1, day);
            }
            if (data.endTime && typeof data.endTime === 'string') {
                const [day, month, year] = data.endTime.split('-').map(Number);
                data.endTime = new Date(year, month - 1, day);
            }
            return yield banner_model_1.Banner.create(data);
        });
    }
    updateBanner(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (data.startTime && typeof data.startTime === 'string') {
                const [day, month, year] = data.startTime.split('-').map(Number);
                data.startTime = new Date(year, month - 1, day);
            }
            if (data.endTime && typeof data.endTime === 'string') {
                const [day, month, year] = data.endTime.split('-').map(Number);
                data.endTime = new Date(year, month - 1, day);
            }
            const banner = yield banner_model_1.Banner.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: data }, { new: true, runValidators: true });
            if (!banner) {
                throw new AppError_1.default('Banner not found', 404);
            }
            return banner;
        });
    }
    softDeleteBanner(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const banner = yield banner_model_1.Banner.findOneAndUpdate({ _id: id, isDeleted: false }, {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    status: banner_model_1.BannerStatus.INACTIVE
                }
            }, { new: true });
            if (!banner) {
                throw new AppError_1.default('Banner not found', 404);
            }
            return { message: 'Banner deleted successfully' };
        });
    }
    _formatBanner(banner) {
        if (!banner)
            return banner;
        const formatDate = (date) => {
            if (!date)
                return null;
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
        };
        return Object.assign(Object.assign({}, banner), { startTime: formatDate(banner.startTime), endTime: formatDate(banner.endTime) });
    }
    getActiveBanners() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            // Find banners that are ACTIVE, not deleted, and within the time range
            const banners = yield banner_model_1.Banner.find({
                status: banner_model_1.BannerStatus.ACTIVE,
                isDeleted: false,
                startTime: { $lte: now },
                endTime: { $gte: now }
            }).sort({ startTime: -1 }).lean();
            return banners.map(banner => this._formatBanner(banner));
        });
    }
    getAllBanners(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { status, search, page = 1, limit = 10 } = filters;
            const query = { isDeleted: false };
            if (status)
                query.status = status;
            if (search) {
                query.title = { $regex: search, $options: 'i' };
            }
            const skip = (Number(page) - 1) * Number(limit);
            const [banners, total] = yield Promise.all([
                banner_model_1.Banner.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean(),
                banner_model_1.Banner.countDocuments(query)
            ]);
            return {
                banners: banners.map(banner => this._formatBanner(banner)),
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            };
        });
    }
}
exports.default = new BannerService();
