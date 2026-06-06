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
const order_model_1 = require("../models/order.model");
const user_model_1 = require("../models/user.model");
const providerProfile_model_1 = require("../models/providerProfile.model");
const profile_model_1 = require("../models/profile.model");
const food_model_1 = require("../models/food.model");
const category_model_1 = require("../models/category.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
const distance_utils_1 = require("../utils/distance.utils");
const mongoose_1 = require("mongoose");
class ProviderService {
    getCustomerAvatarMap(customerIds) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const uniqueCustomerIds = Array.from(new Set(customerIds.filter(Boolean)));
            if (uniqueCustomerIds.length === 0) {
                return new Map();
            }
            const objectIds = uniqueCustomerIds
                .filter(id => mongoose_1.Types.ObjectId.isValid(id))
                .map(id => new mongoose_1.Types.ObjectId(id));
            if (objectIds.length === 0) {
                return new Map();
            }
            const profiles = yield profile_model_1.Profile.find({ userId: { $in: objectIds } })
                .select('userId profilePic avatar')
                .lean();
            const avatarMap = new Map();
            for (const profile of profiles) {
                const userId = (_b = (_a = profile === null || profile === void 0 ? void 0 : profile.userId) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a);
                if (!userId)
                    continue;
                const avatar = (profile === null || profile === void 0 ? void 0 : profile.profilePic) || (profile === null || profile === void 0 ? void 0 : profile.avatar) || '';
                if (avatar)
                    avatarMap.set(userId, avatar);
            }
            return avatarMap;
        });
    }
    /**
     * Get nearby providers using Haversine formula
     */
    getNearbyProviders(input) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { latitude, longitude, radius, page = 1, limit = 20, cuisine, sortBy = 'distance' } = input;
            // Validate coordinates
            if (!(0, distance_utils_1.isValidCoordinates)(latitude, longitude)) {
                throw new AppError_1.default('Invalid coordinates provided', 400, 'INVALID_COORDINATES');
            }
            // Build query for active and verified providers
            const query = {
                isActive: true,
                status: 'ACTIVE',
                verificationStatus: { $in: ['APPROVED', 'ACTIVE'] }, // Updated to allow both
                'location.lat': { $exists: true, $ne: null },
                'location.lng': { $exists: true, $ne: null }
            };
            // Filter by cuisine if provided
            if (cuisine) {
                // Find categories that match the cuisine name (case-insensitive)
                const matchingCategories = yield category_model_1.Category.find({
                    categoryName: { $regex: new RegExp(`^${cuisine}$`, 'i') }
                }).select('providerId').lean();
                const providerIdsWithCategory = matchingCategories.map(c => c.providerId);
                query.$or = [
                    { cuisine: { $in: [new RegExp(`^${cuisine}$`, 'i')] } },
                    { providerId: { $in: providerIdsWithCategory } }
                ];
            }
            // Fetch all providers (we'll filter by distance in memory)
            // For production with large datasets, use MongoDB geospatial queries
            const providers = yield providerProfile_model_1.ProviderProfile.find(query)
                .select('providerId restaurantName location cuisine restaurantAddress city state phoneNumber contactEmail profile isVerify verificationStatus')
                .lean();
            if (providers.length === 0) {
                return {
                    providers: [],
                    pagination: {
                        total: 0,
                        page,
                        limit,
                        totalPages: 0
                    }
                };
            }
            // Calculate distance for each provider and filter by radius
            const providersWithDistance = [];
            for (const provider of providers) {
                // Skip providers without valid location
                if (!((_a = provider.location) === null || _a === void 0 ? void 0 : _a.lat) || !((_b = provider.location) === null || _b === void 0 ? void 0 : _b.lng)) {
                    continue;
                }
                const distance = (0, distance_utils_1.calculateDistance)({ lat: latitude, lng: longitude }, { lat: provider.location.lat, lng: provider.location.lng });
                // Only include providers within radius
                if (distance <= radius) {
                    // Get food count for this provider
                    const foodCount = yield food_model_1.Food.countDocuments({
                        providerId: provider.providerId,
                        foodStatus: { $ne: false },
                        foodAvailability: { $ne: false }
                    });
                    providersWithDistance.push({
                        providerId: provider.providerId.toString(),
                        restaurantName: provider.restaurantName,
                        location: {
                            lat: provider.location.lat,
                            lng: provider.location.lng
                        },
                        distance,
                        cuisine: provider.cuisine || [],
                        restaurantAddress: provider.restaurantAddress,
                        city: provider.city,
                        state: provider.state,
                        phoneNumber: provider.phoneNumber,
                        contactEmail: provider.contactEmail,
                        profile: provider.profile,
                        isVerify: provider.isVerify,
                        verificationStatus: provider.verificationStatus,
                        availableFoods: foodCount
                    });
                }
            }
            // Sort providers
            if (sortBy === 'distance') {
                providersWithDistance.sort((a, b) => a.distance - b.distance);
            }
            else if (sortBy === 'name') {
                providersWithDistance.sort((a, b) => a.restaurantName.localeCompare(b.restaurantName));
            }
            // Pagination
            const total = providersWithDistance.length;
            const totalPages = Math.ceil(total / limit);
            const skip = (page - 1) * limit;
            const paginatedProviders = providersWithDistance.slice(skip, skip + limit);
            return {
                providers: paginatedProviders,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            };
        });
    }
    /**
     * Get providers near the customer that have checkout donations.
     */
    getNearbyDonatedFoods(input) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            const latitude = Number(input.latitude);
            const longitude = Number(input.longitude);
            const radius = Number(input.radius || 10);
            const page = Number(input.page || 1);
            const limit = Number(input.limit || 20);
            const cuisine = input.cuisine;
            const sortBy = input.sortBy || 'distance';
            const hasValidSearchLocation = (0, distance_utils_1.isValidCoordinates)(latitude, longitude);
            const donatedOrders = yield order_model_1.Order.find({
                $or: [
                    { isDonation: true },
                    { donationAmount: { $gt: 0 } }
                ],
                status: { $ne: order_model_1.OrderStatus.CANCELLED },
            })
                .select('providerId items donationAmount')
                .populate('items.foodId', 'title image productDescription finalPriceTag rating foodAvailability')
                .sort({ createdAt: -1 })
                .lean();
            if (donatedOrders.length === 0) {
                return {
                    donatedFoods: [],
                    pagination: {
                        total: 0,
                        page,
                        limit,
                        totalPages: 0,
                        hasNextPage: false,
                        hasPrevPage: false,
                    },
                };
            }
            const donationByProvider = new Map();
            for (const order of donatedOrders) {
                const providerId = ((_b = (_a = order.providerId) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) || String(order.providerId || '');
                if (!providerId)
                    continue;
                let current = donationByProvider.get(providerId);
                if (!current) {
                    current = {
                        providerId,
                        donatedMealCount: 0,
                        totalDonationAmount: 0,
                        donationOrderCount: 0,
                        donatedFoods: [],
                        donatedFoodById: new Map(),
                    };
                    donationByProvider.set(providerId, current);
                }
                current.totalDonationAmount += Number(order.donationAmount || 0);
                current.donationOrderCount += 1;
                for (const item of order.items || []) {
                    const quantity = Number(item.quantity || 0);
                    if (!Number.isFinite(quantity) || quantity <= 0)
                        continue;
                    current.donatedMealCount += quantity;
                    const food = item.foodId;
                    const foodId = ((_d = (_c = food === null || food === void 0 ? void 0 : food._id) === null || _c === void 0 ? void 0 : _c.toString) === null || _d === void 0 ? void 0 : _d.call(_c)) || ((_e = food === null || food === void 0 ? void 0 : food.toString) === null || _e === void 0 ? void 0 : _e.call(food)) || String(item.foodId || '');
                    if (!foodId)
                        continue;
                    const existingFood = current.donatedFoodById.get(foodId);
                    if (existingFood) {
                        existingFood.quantity += quantity;
                        continue;
                    }
                    const donatedFood = {
                        foodId,
                        title: String((food === null || food === void 0 ? void 0 : food.title) || 'Donated item'),
                        image: String((food === null || food === void 0 ? void 0 : food.image) || ''),
                        quantity,
                        productDescription: String((food === null || food === void 0 ? void 0 : food.productDescription) || ''),
                        price: Number((food === null || food === void 0 ? void 0 : food.finalPriceTag) || 0),
                        finalPriceTag: Number((food === null || food === void 0 ? void 0 : food.finalPriceTag) || 0),
                        rating: Number((food === null || food === void 0 ? void 0 : food.rating) || 0),
                        inStock: (food === null || food === void 0 ? void 0 : food.foodAvailability) !== false,
                    };
                    current.donatedFoodById.set(foodId, donatedFood);
                    current.donatedFoods.push(donatedFood);
                }
            }
            const providerObjectIds = Array.from(donationByProvider.keys())
                .filter((providerId) => mongoose_1.Types.ObjectId.isValid(providerId))
                .map((providerId) => new mongoose_1.Types.ObjectId(providerId));
            if (providerObjectIds.length === 0) {
                return {
                    donatedFoods: [],
                    pagination: {
                        total: 0,
                        page,
                        limit,
                        totalPages: 0,
                        hasNextPage: false,
                        hasPrevPage: false,
                    },
                };
            }
            const query = {
                providerId: { $in: providerObjectIds },
                isActive: true,
                status: 'ACTIVE',
                verificationStatus: { $in: ['APPROVED', 'ACTIVE'] },
            };
            if (hasValidSearchLocation) {
                query['location.lat'] = { $exists: true, $ne: null };
                query['location.lng'] = { $exists: true, $ne: null };
            }
            if (cuisine) {
                const matchingCategories = yield category_model_1.Category.find({
                    categoryName: { $regex: new RegExp(`^${cuisine}$`, 'i') },
                }).select('providerId').lean();
                const providerIdsWithCategory = matchingCategories.map(c => c.providerId);
                query.$or = [
                    { cuisine: { $in: [new RegExp(`^${cuisine}$`, 'i')] } },
                    { providerId: { $in: providerIdsWithCategory } },
                ];
            }
            const [providers, foodCountRows] = yield Promise.all([
                providerProfile_model_1.ProviderProfile.find(query)
                    .select('providerId restaurantName location cuisine restaurantAddress city state phoneNumber contactEmail profile isVerify verificationStatus')
                    .lean(),
                food_model_1.Food.aggregate([
                    {
                        $match: {
                            providerId: { $in: providerObjectIds },
                            foodStatus: { $ne: false },
                            foodAvailability: { $ne: false },
                        },
                    },
                    { $group: { _id: '$providerId', count: { $sum: 1 } } },
                ]),
            ]);
            const foodCountByProvider = new Map(foodCountRows.map((row) => [row._id.toString(), row.count]));
            const donatedFoodsWithDistance = [];
            for (const provider of providers) {
                const hasProviderLocation = typeof ((_f = provider.location) === null || _f === void 0 ? void 0 : _f.lat) === 'number' &&
                    typeof ((_g = provider.location) === null || _g === void 0 ? void 0 : _g.lng) === 'number';
                if (hasValidSearchLocation && !hasProviderLocation) {
                    continue;
                }
                const providerId = provider.providerId.toString();
                const donation = donationByProvider.get(providerId);
                if (!donation)
                    continue;
                const distance = hasValidSearchLocation && hasProviderLocation
                    ? (0, distance_utils_1.calculateDistance)({ lat: latitude, lng: longitude }, { lat: provider.location.lat, lng: provider.location.lng })
                    : 0;
                if (hasValidSearchLocation && distance > radius)
                    continue;
                const donatedFoods = donation.donatedFoods;
                donatedFoodsWithDistance.push({
                    providerId,
                    restaurantName: provider.restaurantName,
                    location: {
                        lat: ((_h = provider.location) === null || _h === void 0 ? void 0 : _h.lat) || 0,
                        lng: ((_j = provider.location) === null || _j === void 0 ? void 0 : _j.lng) || 0,
                    },
                    distance,
                    cuisine: provider.cuisine || [],
                    restaurantAddress: provider.restaurantAddress,
                    city: provider.city,
                    state: provider.state,
                    phoneNumber: provider.phoneNumber,
                    contactEmail: provider.contactEmail,
                    profile: provider.profile,
                    isVerify: provider.isVerify,
                    verificationStatus: provider.verificationStatus,
                    availableFoods: foodCountByProvider.get(providerId) || 0,
                    donatedMealCount: donation.donatedMealCount,
                    totalDonationAmount: Number(donation.totalDonationAmount.toFixed(2)),
                    donationOrderCount: donation.donationOrderCount,
                    donatedFoodCount: donatedFoods.length,
                    donatedFoods,
                    recentDonatedFoods: donatedFoods,
                });
            }
            const donatedFoodCards = donatedFoodsWithDistance.flatMap((provider) => provider.donatedFoods.map((food) => (Object.assign(Object.assign({}, food), { id: food.foodId, name: food.title, donatedQuantity: food.quantity, providerId: provider.providerId, providerName: provider.restaurantName, restaurantName: provider.restaurantName, location: provider.location, restaurantAddress: provider.restaurantAddress, city: provider.city, state: provider.state, distance: provider.distance, cuisine: provider.cuisine, totalDonationAmount: provider.totalDonationAmount, donationOrderCount: provider.donationOrderCount, providerProfile: provider.profile, profile: provider.profile, availableFoods: provider.availableFoods || 0 }))));
            if (sortBy === 'distance') {
                donatedFoodCards.sort((a, b) => a.distance - b.distance);
            }
            else if (sortBy === 'name') {
                donatedFoodCards.sort((a, b) => a.name.localeCompare(b.name));
            }
            else if (sortBy === 'rating') {
                donatedFoodCards.sort((a, b) => b.rating - a.rating);
            }
            const total = donatedFoodCards.length;
            const totalPages = Math.ceil(total / limit);
            const skip = (page - 1) * limit;
            const paginatedDonatedFoods = donatedFoodCards.slice(skip, skip + limit);
            return {
                donatedFoods: paginatedDonatedFoods,
                donatedFoodSpots: donatedFoodsWithDistance,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                },
            };
        });
    }
    getCustomerDetails(providerId, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const pId = new mongoose_1.Types.ObjectId(providerId);
            const cId = new mongoose_1.Types.ObjectId(customerId);
            const orderExists = yield order_model_1.Order.exists({ providerId: pId, customerId: cId });
            if (!orderExists) {
                throw new AppError_1.default('You can only view details of customers who have ordered from you', 403, 'CUSTOMER_ACCESS_ERROR');
            }
            const customer = yield user_model_1.User.findById(cId).select('fullName email phone profilePic');
            if (!customer) {
                throw new AppError_1.default('Customer not found', 404, 'CUSTOMER_NOT_FOUND_ERROR');
            }
            const itemsAggregation = yield order_model_1.Order.aggregate([
                { $match: { providerId: pId, customerId: cId } },
                { $unwind: '$items' },
                {
                    $lookup: {
                        from: 'foods',
                        localField: 'items.foodId',
                        foreignField: '_id',
                        as: 'foodDetails',
                    },
                },
                { $unwind: '$foodDetails' },
                {
                    $group: {
                        _id: '$items.foodId',
                        foodName: { $first: '$foodDetails.title' },
                        image: { $first: '$foodDetails.image' },
                        quantity: { $sum: '$items.quantity' },
                        totalPrice: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        image: 1,
                        foodName: 1,
                        quantity: 1,
                        totalPrice: 1,
                    },
                },
            ]);
            const subTotal = itemsAggregation.reduce((sum, item) => sum + item.totalPrice, 0);
            const estimatedTax = Number((subTotal * 0.1).toFixed(2)); // 10% tax
            const serviceFeeAggregation = yield order_model_1.Order.aggregate([
                { $match: { providerId: pId, customerId: cId } },
                { $unwind: '$items' },
                {
                    $lookup: {
                        from: 'foods',
                        localField: 'items.foodId',
                        foreignField: '_id',
                        as: 'foodDetails',
                    },
                },
                { $unwind: '$foodDetails' },
                {
                    $group: {
                        _id: null,
                        totalServiceFee: { $sum: { $multiply: ['$items.quantity', '$foodDetails.serviceFee'] } }
                    }
                }
            ]);
            const totalServiceFee = ((_a = serviceFeeAggregation[0]) === null || _a === void 0 ? void 0 : _a.totalServiceFee) || 0;
            const grandTotal = subTotal + estimatedTax + totalServiceFee;
            const orders = yield order_model_1.Order.find({ providerId: pId, customerId: cId })
                .sort({ createdAt: -1 })
                .select('status')
                .limit(2);
            const currentStatus = ((_b = orders[0]) === null || _b === void 0 ? void 0 : _b.status) || 'Unknown';
            const previousStatus = ((_c = orders[1]) === null || _c === void 0 ? void 0 : _c.status) || 'None';
            let nextStatus = 'None';
            switch (currentStatus) {
                case order_model_1.OrderStatus.PENDING:
                    nextStatus = order_model_1.OrderStatus.PREPARING;
                    break;
                case order_model_1.OrderStatus.PREPARING:
                    nextStatus = order_model_1.OrderStatus.READY_FOR_PICKUP;
                    break;
                case order_model_1.OrderStatus.READY_FOR_PICKUP:
                    nextStatus = order_model_1.OrderStatus.PICKED_UP;
                    break;
                default:
                    nextStatus = 'None';
            }
            return {
                productsDetail: {
                    items: itemsAggregation,
                    subTotal: Number(subTotal.toFixed(2)),
                    estimatedTax,
                    serviceFee: Number(totalServiceFee.toFixed(2)),
                    grandTotal: Number(grandTotal.toFixed(2)),
                },
                orderStatus: {
                    previousStatus,
                    currentStatus,
                    nextStatus,
                },
                customerInfo: {
                    profilePic: customer.profilePic,
                    customerName: customer.fullName,
                    email: customer.email,
                    phone: customer.phone,
                },
            };
        });
    }
    getReadyOrders(providerId_1) {
        return __awaiter(this, arguments, void 0, function* (providerId, page = 1, limit = 10) {
            const pId = new mongoose_1.Types.ObjectId(providerId);
            const skip = (page - 1) * limit;
            const [orders, total] = yield Promise.all([
                order_model_1.Order.find({
                    providerId: pId,
                    status: order_model_1.OrderStatus.READY_FOR_PICKUP
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('customerId', 'fullName email phone profilePic googlePicture')
                    .populate('items.foodId', 'title image'),
                order_model_1.Order.countDocuments({
                    providerId: pId,
                    status: order_model_1.OrderStatus.READY_FOR_PICKUP
                })
            ]);
            const totalPages = Math.ceil(total / limit);
            const customerAvatarMap = yield this.getCustomerAvatarMap(orders
                .map((order) => { var _a, _b, _c; return ((_c = (_b = (_a = order === null || order === void 0 ? void 0 : order.customerId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString) === null || _c === void 0 ? void 0 : _c.call(_b)) || ''; })
                .filter(Boolean));
            const formattedOrders = orders.map(order => {
                var _a, _b;
                const customer = order.customerId;
                const customerId = ((_b = (_a = customer === null || customer === void 0 ? void 0 : customer._id) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) || '';
                const customerAvatar = (customer === null || customer === void 0 ? void 0 : customer.profilePic) ||
                    (customer === null || customer === void 0 ? void 0 : customer.googlePicture) ||
                    (customerId ? customerAvatarMap.get(customerId) : '') ||
                    '';
                const displayTotalAmount = order.totalPrice > 0 ? order.totalPrice : order.subtotal;
                return {
                    orderId: order.orderId,
                    status: order.status,
                    createdAt: order.createdAt,
                    customer: {
                        id: customer === null || customer === void 0 ? void 0 : customer._id,
                        name: (customer === null || customer === void 0 ? void 0 : customer.fullName) || 'Unknown',
                        phone: customer === null || customer === void 0 ? void 0 : customer.phone,
                        profilePic: customerAvatar,
                        avatar: customerAvatar,
                        profilePicture: customerAvatar,
                    },
                    items: order.items.map((item) => {
                        var _a, _b;
                        return ({
                            name: ((_a = item.foodId) === null || _a === void 0 ? void 0 : _a.title) || 'Unknown Item',
                            image: (_b = item.foodId) === null || _b === void 0 ? void 0 : _b.image,
                            quantity: item.quantity,
                            price: item.price
                        });
                    }),
                    subtotal: order.subtotal,
                    platformFee: order.platformFee,
                    stateTax: order.stateTax,
                    donationAmount: order.donationAmount || 0,
                    totalAmount: displayTotalAmount,
                    actualTotalAmount: order.totalPrice,
                    vendorAmount: order.vendorAmount || 0,
                    paymentStatus: order.paymentStatus,
                    paymentMethod: order.paymentMethod,
                    pickupTime: order.pickupTime
                };
            });
            return {
                orders: formattedOrders,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages
                }
            };
        });
    }
    getOrders(providerId_1) {
        return __awaiter(this, arguments, void 0, function* (providerId, page = 1, limit = 10, status = 'all') {
            const pId = new mongoose_1.Types.ObjectId(providerId);
            const skip = (page - 1) * limit;
            const query = { providerId: pId };
            // Filter by status if provided and not 'all'
            if (status && status !== 'all') {
                query.status = status;
            }
            const [orders, total] = yield Promise.all([
                order_model_1.Order.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('customerId', 'fullName email phone profilePic googlePicture')
                    .populate('items.foodId', 'title image'),
                order_model_1.Order.countDocuments(query)
            ]);
            const totalPages = Math.ceil(total / limit);
            const customerAvatarMap = yield this.getCustomerAvatarMap(orders
                .map((order) => { var _a, _b, _c; return ((_c = (_b = (_a = order === null || order === void 0 ? void 0 : order.customerId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString) === null || _c === void 0 ? void 0 : _c.call(_b)) || ''; })
                .filter(Boolean));
            const formattedOrders = orders.map(order => {
                var _a, _b;
                const customer = order.customerId;
                const customerId = ((_b = (_a = customer === null || customer === void 0 ? void 0 : customer._id) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) || '';
                const customerAvatar = (customer === null || customer === void 0 ? void 0 : customer.profilePic) ||
                    (customer === null || customer === void 0 ? void 0 : customer.googlePicture) ||
                    (customerId ? customerAvatarMap.get(customerId) : '') ||
                    '';
                const displayTotalAmount = order.totalPrice > 0 ? order.totalPrice : order.subtotal;
                return {
                    orderId: order.orderId,
                    status: order.status,
                    createdAt: order.createdAt,
                    customer: {
                        id: customer === null || customer === void 0 ? void 0 : customer._id,
                        name: (customer === null || customer === void 0 ? void 0 : customer.fullName) || 'Unknown',
                        phone: customer === null || customer === void 0 ? void 0 : customer.phone,
                        profilePic: customerAvatar,
                        avatar: customerAvatar,
                        profilePicture: customerAvatar,
                    },
                    items: order.items.map((item) => {
                        var _a, _b;
                        return ({
                            name: ((_a = item.foodId) === null || _a === void 0 ? void 0 : _a.title) || 'Unknown Item',
                            image: (_b = item.foodId) === null || _b === void 0 ? void 0 : _b.image,
                            quantity: item.quantity,
                            price: item.price
                        });
                    }),
                    subtotal: order.subtotal,
                    platformFee: order.platformFee,
                    stateTax: order.stateTax,
                    donationAmount: order.donationAmount || 0,
                    totalAmount: displayTotalAmount,
                    actualTotalAmount: order.totalPrice,
                    vendorAmount: order.vendorAmount || 0,
                    paymentStatus: order.paymentStatus,
                    paymentMethod: order.paymentMethod,
                    pickupTime: order.pickupTime
                };
            });
            return {
                orders: formattedOrders,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages
                }
            };
        });
    }
}
exports.default = new ProviderService();
