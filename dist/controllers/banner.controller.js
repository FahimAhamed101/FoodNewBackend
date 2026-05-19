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
const catchAsync_1 = require("../utils/catchAsync");
const banner_service_1 = __importDefault(require("../services/banner.service"));
class BannerController {
    constructor() {
        this.createBanner = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const banner = yield banner_service_1.default.createBanner(req.body);
            res.status(201).json({
                success: true,
                data: banner
            });
        }));
        this.updateBanner = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const id = req.params.id;
            const banner = yield banner_service_1.default.updateBanner(id, req.body);
            res.status(200).json({
                success: true,
                data: banner
            });
        }));
        this.deleteBanner = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const id = req.params.id;
            const result = yield banner_service_1.default.softDeleteBanner(id);
            res.status(200).json(Object.assign({ success: true }, result));
        }));
        this.getActiveBanners = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const banners = yield banner_service_1.default.getActiveBanners();
            res.status(200).json({
                success: true,
                results: banners.length,
                data: banners
            });
        }));
        this.listAllBanners = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield banner_service_1.default.getAllBanners(req.query);
            res.status(200).json(Object.assign({ success: true }, result));
        }));
    }
}
exports.default = new BannerController();
