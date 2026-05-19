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
const bcrypt_1 = __importDefault(require("bcrypt"));
const mongoose_1 = require("mongoose");
const db_1 = __importDefault(require("./database/db"));
const stateSeeder_service_1 = __importDefault(require("./services/stateSeeder.service"));
const user_model_1 = require("./models/user.model");
const profile_model_1 = require("./models/profile.model");
const providerProfile_model_1 = require("./models/providerProfile.model");
const category_model_1 = require("./models/category.model");
const food_model_1 = require("./models/food.model");
const banner_model_1 = require("./models/banner.model");
const order_model_1 = require("./models/order.model");
const payment_model_1 = require("./models/payment.model");
const review_model_1 = require("./models/review.model");
const favorite_model_1 = require("./models/favorite.model");
const cart_model_1 = require("./models/cart.model");
const state_model_1 = require("./models/state.model");
const notification_model_1 = require("./models/notification.model");
const paymentMethod_model_1 = require("./models/paymentMethod.model");
const systemConfig_model_1 = require("./models/systemConfig.model");
const SEED_PASSWORD = 'Password123!';
const SEED_SYSTEM_CONFIG_KEYS = ['seed.platformFeePerItem', 'seed.supportEmail', 'seed.currency'];
const FOOD_IMAGE_POOL = [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&w=1200&q=80',
];
const BANNER_IMAGE_POOL = [
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1600&q=80',
];
const PROVIDERS = [
    {
        fullName: 'Ariana Brooks',
        email: 'provider.burger@seed.foodapp.local',
        phone: '+1-212-555-0101',
        restaurantName: 'Brooklyn Burger Barn',
        restaurantAddress: '145 Atlantic Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '11201',
        cuisine: ['American', 'Burgers', 'Fast Casual'],
        location: { lat: 40.6904, lng: -73.9967 },
        categories: ['Burgers', 'Sides', 'Drinks'],
        profileImage: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
    },
    {
        fullName: 'Marco Bellini',
        email: 'provider.pizza@seed.foodapp.local',
        phone: '+1-312-555-0102',
        restaurantName: 'ChiTown Pizza Co.',
        restaurantAddress: '221 W Madison St',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60606',
        cuisine: ['Italian', 'Pizza', 'Pasta'],
        location: { lat: 41.8811, lng: -87.6376 },
        categories: ['Pizza', 'Pasta', 'Desserts'],
        profileImage: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
    },
    {
        fullName: 'Yuki Tanaka',
        email: 'provider.sushi@seed.foodapp.local',
        phone: '+1-415-555-0103',
        restaurantName: 'Sakura Roll House',
        restaurantAddress: '88 Market St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        cuisine: ['Japanese', 'Sushi', 'Seafood'],
        location: { lat: 37.7936, lng: -122.3958 },
        categories: ['Sushi Rolls', 'Bento', 'Drinks'],
        profileImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    },
    {
        fullName: 'Riya Sharma',
        email: 'provider.spice@seed.foodapp.local',
        phone: '+1-512-555-0104',
        restaurantName: 'Spice Route Kitchen',
        restaurantAddress: '604 Congress Ave',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        cuisine: ['Indian', 'Curries', 'Rice Bowls'],
        location: { lat: 30.2682, lng: -97.7429 },
        categories: ['Curries', 'Biryanis', 'Desserts'],
        profileImage: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
    },
];
const CUSTOMERS = [
    {
        fullName: 'Liam Carter',
        email: 'customer.liam@seed.foodapp.local',
        phone: '+1-202-555-0201',
        city: 'Washington',
        state: 'DC',
        address: '400 7th St NW',
        avatar: 'https://i.pravatar.cc/300?img=12',
    },
    {
        fullName: 'Sophia Nguyen',
        email: 'customer.sophia@seed.foodapp.local',
        phone: '+1-718-555-0202',
        city: 'Queens',
        state: 'NY',
        address: '33-01 Northern Blvd',
        avatar: 'https://i.pravatar.cc/300?img=32',
    },
    {
        fullName: 'Noah Williams',
        email: 'customer.noah@seed.foodapp.local',
        phone: '+1-305-555-0203',
        city: 'Miami',
        state: 'FL',
        address: '120 Biscayne Blvd',
        avatar: 'https://i.pravatar.cc/300?img=15',
    },
    {
        fullName: 'Emma Rodriguez',
        email: 'customer.emma@seed.foodapp.local',
        phone: '+1-214-555-0204',
        city: 'Dallas',
        state: 'TX',
        address: '901 Main St',
        avatar: 'https://i.pravatar.cc/300?img=47',
    },
    {
        fullName: 'Mason Patel',
        email: 'customer.mason@seed.foodapp.local',
        phone: '+1-602-555-0205',
        city: 'Phoenix',
        state: 'AZ',
        address: '77 Camelback Rd',
        avatar: 'https://i.pravatar.cc/300?img=54',
    },
    {
        fullName: 'Olivia Green',
        email: 'customer.olivia@seed.foodapp.local',
        phone: '+1-206-555-0206',
        city: 'Seattle',
        state: 'WA',
        address: '515 Pike St',
        avatar: 'https://i.pravatar.cc/300?img=25',
    },
];
const MENU_LIBRARY = {
    Burgers: [
        { title: 'Classic Smash Burger', productDescription: 'Double smashed beef patties, cheddar, onions, and house sauce.', baseRevenue: 9.5, serviceFee: 1.5, calories: 760 },
        { title: 'Bacon Ranch Melt', productDescription: 'Grilled beef burger with crispy bacon, ranch, and Swiss cheese.', baseRevenue: 10.25, serviceFee: 1.75, calories: 845 },
        { title: 'Spicy Jalapeno Stack', productDescription: 'Pepper jack, jalapeno relish, pickles, and smoky mayo.', baseRevenue: 10.75, serviceFee: 1.8, calories: 790 },
        { title: 'Mushroom Swiss Deluxe', productDescription: 'Sauteed mushrooms, caramelized onion, and toasted brioche bun.', baseRevenue: 11.0, serviceFee: 1.85, calories: 810 },
    ],
    Sides: [
        { title: 'Loaded Crinkle Fries', productDescription: 'Golden fries topped with cheese sauce, herbs, and crispy onions.', baseRevenue: 4.5, serviceFee: 0.95, calories: 430 },
        { title: 'Truffle Parmesan Fries', productDescription: 'Fries tossed with truffle oil, parmesan, and parsley.', baseRevenue: 5.0, serviceFee: 1.0, calories: 410 },
        { title: 'Crispy Onion Rings', productDescription: 'Beer-battered onion rings with chipotle aioli.', baseRevenue: 4.75, serviceFee: 0.9, calories: 390 },
        { title: 'Chicken Tender Bites', productDescription: 'Crunchy chicken bites with honey mustard dip.', baseRevenue: 6.25, serviceFee: 1.1, calories: 520 },
    ],
    Drinks: [
        { title: 'Citrus Mint Cooler', productDescription: 'Fresh lemon, mint, and sparkling soda over ice.', baseRevenue: 2.75, serviceFee: 0.6, calories: 110 },
        { title: 'Strawberry Iced Tea', productDescription: 'Black tea infused with strawberry puree and lemon.', baseRevenue: 2.95, serviceFee: 0.6, calories: 95 },
        { title: 'Mango Lassi', productDescription: 'Creamy yogurt drink blended with ripe mango.', baseRevenue: 3.25, serviceFee: 0.7, calories: 180 },
        { title: 'Cold Brew Coffee', productDescription: 'Slow-steeped cold brew served over ice.', baseRevenue: 3.0, serviceFee: 0.65, calories: 45 },
    ],
    Pizza: [
        { title: 'Margherita Fire Pie', productDescription: 'Fresh mozzarella, basil, tomato sauce, and olive oil.', baseRevenue: 12.5, serviceFee: 1.9, calories: 910 },
        { title: 'Pepperoni Supreme Slice', productDescription: 'Loaded with pepperoni, mozzarella, and oregano.', baseRevenue: 13.25, serviceFee: 2.0, calories: 980 },
        { title: 'BBQ Chicken Crust', productDescription: 'BBQ chicken, red onion, cilantro, and smoked gouda.', baseRevenue: 14.0, serviceFee: 2.1, calories: 1020 },
        { title: 'Veggie Garden Pizza', productDescription: 'Bell peppers, olives, mushrooms, and roasted garlic.', baseRevenue: 12.95, serviceFee: 1.95, calories: 890 },
    ],
    Pasta: [
        { title: 'Creamy Alfredo Rigatoni', productDescription: 'Rigatoni pasta in parmesan alfredo with cracked pepper.', baseRevenue: 11.75, serviceFee: 1.6, calories: 780 },
        { title: 'Spicy Arrabbiata Penne', productDescription: 'Penne in a bold tomato sauce with chili flakes and basil.', baseRevenue: 10.95, serviceFee: 1.55, calories: 690 },
        { title: 'Truffle Mushroom Fettuccine', productDescription: 'Silky fettuccine with sauteed mushrooms and truffle cream.', baseRevenue: 13.5, serviceFee: 1.9, calories: 820 },
        { title: 'Baked Meatball Ziti', productDescription: 'Oven-baked ziti with meatballs, mozzarella, and marinara.', baseRevenue: 12.25, serviceFee: 1.8, calories: 860 },
    ],
    Desserts: [
        { title: 'Tiramisu Cloud Cup', productDescription: 'Espresso-soaked layers with mascarpone cream.', baseRevenue: 5.5, serviceFee: 0.95, calories: 340 },
        { title: 'Chocolate Lava Slice', productDescription: 'Warm chocolate cake with a gooey center.', baseRevenue: 5.75, serviceFee: 1.0, calories: 410 },
        { title: 'Pistachio Kulfi Bar', productDescription: 'Creamy frozen milk dessert with crushed pistachio.', baseRevenue: 4.95, serviceFee: 0.85, calories: 260 },
        { title: 'Cinnamon Sugar Churros', productDescription: 'Crispy churros with cinnamon sugar and chocolate dip.', baseRevenue: 5.25, serviceFee: 0.9, calories: 390 },
    ],
    'Sushi Rolls': [
        { title: 'Salmon Avocado Roll', productDescription: 'Fresh salmon, avocado, and seasoned rice.', baseRevenue: 11.5, serviceFee: 1.7, calories: 420 },
        { title: 'Crunchy Shrimp Tempura Roll', productDescription: 'Shrimp tempura, cucumber, and spicy mayo.', baseRevenue: 12.95, serviceFee: 1.85, calories: 540 },
        { title: 'Dragon Eel Roll', productDescription: 'Unagi, avocado, cucumber, and eel sauce.', baseRevenue: 13.75, serviceFee: 1.95, calories: 560 },
        { title: 'Rainbow Signature Roll', productDescription: 'Crab, avocado, tuna, salmon, and shrimp layered on top.', baseRevenue: 14.5, serviceFee: 2.0, calories: 590 },
    ],
    Bento: [
        { title: 'Teriyaki Chicken Bento', productDescription: 'Grilled chicken, rice, pickles, and salad in a lunch box.', baseRevenue: 12.25, serviceFee: 1.75, calories: 710 },
        { title: 'Beef Bulgogi Bento', productDescription: 'Savory sliced beef, jasmine rice, and sesame vegetables.', baseRevenue: 13.25, serviceFee: 1.8, calories: 760 },
        { title: 'Tofu Katsu Bento', productDescription: 'Crispy tofu cutlet with rice, slaw, and dipping sauce.', baseRevenue: 11.5, serviceFee: 1.6, calories: 640 },
        { title: 'Salmon Rice Bento', productDescription: 'Pan-seared salmon, steamed rice, and miso-glazed veggies.', baseRevenue: 14.0, serviceFee: 1.95, calories: 680 },
    ],
    Curries: [
        { title: 'Butter Chicken Bowl', productDescription: 'Tender chicken in rich tomato butter curry.', baseRevenue: 12.75, serviceFee: 1.85, calories: 760 },
        { title: 'Paneer Tikka Masala', productDescription: 'Charred paneer cubes in creamy masala gravy.', baseRevenue: 11.95, serviceFee: 1.7, calories: 690 },
        { title: 'Lamb Rogan Josh', productDescription: 'Slow-cooked lamb curry with Kashmiri spices.', baseRevenue: 14.25, serviceFee: 2.0, calories: 810 },
        { title: 'Chana Masala Feast', productDescription: 'Spiced chickpea curry simmered with onion and tomato.', baseRevenue: 10.5, serviceFee: 1.5, calories: 620 },
    ],
    Biryanis: [
        { title: 'Hyderabadi Chicken Biryani', productDescription: 'Fragrant basmati rice layered with spiced chicken.', baseRevenue: 13.25, serviceFee: 1.9, calories: 880 },
        { title: 'Paneer Saffron Biryani', productDescription: 'Saffron rice with paneer, herbs, and caramelized onions.', baseRevenue: 12.2, serviceFee: 1.75, calories: 790 },
        { title: 'Beef Tehari Special', productDescription: 'Slow-cooked rice dish with tender beef and aromatic spices.', baseRevenue: 13.75, serviceFee: 1.95, calories: 910 },
        { title: 'Veg Dum Biryani', productDescription: 'Mixed vegetables and basmati rice finished with ghee.', baseRevenue: 11.5, serviceFee: 1.65, calories: 740 },
    ],
};
const buildOrderHistory = (status, createdAt) => {
    const history = [{ status: order_model_1.OrderStatus.PENDING, timestamp: createdAt }];
    if (status === order_model_1.OrderStatus.PREPARING || status === order_model_1.OrderStatus.READY_FOR_PICKUP || status === order_model_1.OrderStatus.PICKED_UP || status === order_model_1.OrderStatus.COMPLETED) {
        history.push({ status: order_model_1.OrderStatus.PREPARING, timestamp: new Date(createdAt.getTime() + 20 * 60 * 1000) });
    }
    if (status === order_model_1.OrderStatus.READY_FOR_PICKUP || status === order_model_1.OrderStatus.PICKED_UP || status === order_model_1.OrderStatus.COMPLETED) {
        history.push({ status: order_model_1.OrderStatus.READY_FOR_PICKUP, timestamp: new Date(createdAt.getTime() + 40 * 60 * 1000) });
    }
    if (status === order_model_1.OrderStatus.PICKED_UP || status === order_model_1.OrderStatus.COMPLETED) {
        history.push({ status: order_model_1.OrderStatus.PICKED_UP, timestamp: new Date(createdAt.getTime() + 55 * 60 * 1000) });
    }
    if (status === order_model_1.OrderStatus.COMPLETED) {
        history.push({ status: order_model_1.OrderStatus.COMPLETED, timestamp: new Date(createdAt.getTime() + 95 * 60 * 1000) });
    }
    if (status === order_model_1.OrderStatus.CANCELLED) {
        history.push({ status: order_model_1.OrderStatus.CANCELLED, timestamp: new Date(createdAt.getTime() + 15 * 60 * 1000) });
    }
    return history;
};
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickRandom = (items) => items[randomInt(0, items.length - 1)];
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const getImageFromPool = (index, pool) => pool[index % pool.length];
const toObjectId = (value) => new mongoose_1.Types.ObjectId(String(value));
const roundTo2 = (value) => Number(value.toFixed(2));
const upsertUser = (email, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOneAndUpdate({ email }, payload, { upsert: true, new: true, runValidators: true });
    if (!user) {
        throw new Error(`Unable to upsert seed user: ${email}`);
    }
    return user;
});
const buildUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    const passwordHash = yield bcrypt_1.default.hash(SEED_PASSWORD, 10);
    const admin = yield upsertUser('admin@seed.foodapp.local', {
        fullName: 'Seed Platform Admin',
        email: 'admin@seed.foodapp.local',
        passwordHash,
        role: user_model_1.UserRole.ADMIN,
        isEmailVerified: true,
        authProvider: user_model_1.AuthProvider.EMAIL,
        roleAssignedBy: 'system',
        isActive: true,
        isSuspended: false,
        phone: '+1-800-555-0001',
        profilePic: 'https://i.pravatar.cc/300?img=68',
    });
    const providers = yield Promise.all(PROVIDERS.map((provider) => upsertUser(provider.email, {
        fullName: provider.fullName,
        email: provider.email,
        passwordHash,
        role: user_model_1.UserRole.PROVIDER,
        isEmailVerified: true,
        authProvider: user_model_1.AuthProvider.EMAIL,
        roleAssignedBy: 'system',
        isProviderApproved: true,
        providerApprovedAt: new Date(),
        providerApprovedBy: 'system',
        isActive: true,
        isSuspended: false,
        phone: provider.phone,
        profilePic: provider.profileImage,
    })));
    const customers = yield Promise.all(CUSTOMERS.map((customer) => upsertUser(customer.email, {
        fullName: customer.fullName,
        email: customer.email,
        passwordHash,
        role: user_model_1.UserRole.CUSTOMER,
        isEmailVerified: true,
        authProvider: user_model_1.AuthProvider.EMAIL,
        roleAssignedBy: 'system',
        isActive: true,
        isSuspended: false,
        phone: customer.phone,
        profilePic: customer.avatar,
    })));
    return { admin, providers, customers };
});
const clearExistingSeedData = (adminId, providerIds, customerIds) => __awaiter(void 0, void 0, void 0, function* () {
    const foodDocs = yield food_model_1.Food.find({ providerId: { $in: providerIds } }).select('_id').lean();
    const foodIds = foodDocs.map((food) => toObjectId(food._id));
    const orderDocs = yield order_model_1.Order.find({
        $or: [{ providerId: { $in: providerIds } }, { customerId: { $in: customerIds } }],
    }).select('_id').lean();
    const orderIds = orderDocs.map((order) => toObjectId(order._id));
    const userIds = [adminId, ...providerIds, ...customerIds];
    yield Promise.all([
        review_model_1.Review.deleteMany({
            $or: [
                { providerId: { $in: providerIds } },
                { customerId: { $in: customerIds } },
                { foodId: { $in: foodIds } },
                { orderId: { $in: orderIds } },
            ],
        }),
        payment_model_1.Payment.deleteMany({
            $or: [
                { providerId: { $in: providerIds } },
                { customerId: { $in: customerIds } },
                { orderObjectId: { $in: orderIds } },
            ],
        }),
        favorite_model_1.Favorite.deleteMany({
            $or: [{ userId: { $in: customerIds } }, { foodId: { $in: foodIds } }],
        }),
        cart_model_1.Cart.deleteMany({ userId: { $in: customerIds } }),
        notification_model_1.Notification.deleteMany({ userId: { $in: userIds } }),
        order_model_1.Order.deleteMany({
            $or: [{ providerId: { $in: providerIds } }, { customerId: { $in: customerIds } }],
        }),
        food_model_1.Food.deleteMany({ providerId: { $in: providerIds } }),
        category_model_1.Category.deleteMany({ providerId: { $in: providerIds } }),
        providerProfile_model_1.ProviderProfile.deleteMany({ providerId: { $in: providerIds } }),
        profile_model_1.Profile.deleteMany({ userId: { $in: userIds } }),
        paymentMethod_model_1.PaymentMethod.deleteMany({ userId: { $in: customerIds } }),
        banner_model_1.Banner.deleteMany({ title: /^Seed:/ }),
        systemConfig_model_1.SystemConfig.deleteMany({ key: { $in: SEED_SYSTEM_CONFIG_KEYS } }),
    ]);
});
const seedProfiles = (adminId, customerIds) => __awaiter(void 0, void 0, void 0, function* () {
    const profileDocs = [
        {
            userId: adminId,
            name: 'Seed Platform Admin',
            phone: '+1-800-555-0001',
            dateOfBirth: new Date('1990-04-12'),
            address: '100 Platform Way',
            city: 'New York',
            state: 'NY',
            profilePic: 'https://i.pravatar.cc/300?img=68',
            avatar: 'https://i.pravatar.cc/300?img=68',
            bio: 'Demo admin account for dashboard previews.',
            isVerify: true,
            isActive: true,
        },
        ...CUSTOMERS.map((customer, index) => ({
            userId: customerIds[index],
            name: customer.fullName,
            phone: customer.phone,
            dateOfBirth: new Date(`199${index}-0${(index % 8) + 1}-15`),
            address: customer.address,
            city: customer.city,
            state: customer.state,
            profilePic: customer.avatar,
            avatar: customer.avatar,
            bio: `Enjoys trying new dishes in ${customer.city}.`,
            isVerify: true,
            isActive: true,
        })),
    ];
    yield profile_model_1.Profile.insertMany(profileDocs);
});
const seedProviderProfiles = (providerIds) => __awaiter(void 0, void 0, void 0, function* () {
    const docs = PROVIDERS.map((provider, index) => ({
        providerId: providerIds[index],
        profile: provider.profileImage,
        restaurantName: provider.restaurantName,
        contactEmail: provider.email,
        phoneNumber: provider.phone,
        restaurantAddress: provider.restaurantAddress,
        city: provider.city,
        state: provider.state,
        zipCode: provider.zipCode,
        cityTax: 0,
        verificationStatus: 'APPROVED',
        verificationDocuments: ['business_license.pdf', 'tax_certificate.pdf'],
        isVerify: true,
        isActive: true,
        status: 'ACTIVE',
        cuisine: provider.cuisine,
        pickupWindows: [
            { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], startTime: '11:00', endTime: '21:00' },
            { days: ['Sat', 'Sun'], startTime: '12:00', endTime: '22:00' },
        ],
        compliance: {
            alcoholNotice: { enabled: false },
            tax: { region: provider.state, rate: 0 },
        },
        location: provider.location,
    }));
    yield providerProfile_model_1.ProviderProfile.insertMany(docs);
});
const seedCategories = (providerIds) => __awaiter(void 0, void 0, void 0, function* () {
    const categoryDocs = PROVIDERS.flatMap((provider, providerIndex) => provider.categories.map((categoryName, categoryIndex) => ({
        providerId: providerIds[providerIndex],
        categoryName,
        categoryStatus: true,
        image: getImageFromPool(providerIndex * 4 + categoryIndex, FOOD_IMAGE_POOL),
    })));
    const categories = yield category_model_1.Category.insertMany(categoryDocs);
    return categories;
});
const seedFoods = (categories) => __awaiter(void 0, void 0, void 0, function* () {
    let imageIndex = 0;
    const foodDocs = categories.flatMap((category) => (MENU_LIBRARY[category.categoryName] || []).map((item) => ({
        providerId: toObjectId(category.providerId),
        categoryId: toObjectId(category._id),
        title: item.title,
        productDescription: item.productDescription,
        image: getImageFromPool(imageIndex++, FOOD_IMAGE_POOL),
        calories: item.calories,
        baseRevenue: item.baseRevenue,
        serviceFee: item.serviceFee,
        finalPriceTag: roundTo2(item.baseRevenue + item.serviceFee),
        rating: 0,
        foodStatus: true,
        foodAvailability: Math.random() > 0.08,
    })));
    const foods = yield food_model_1.Food.insertMany(foodDocs);
    return foods;
});
const createOrderDoc = (input) => {
    const createdAt = new Date(Date.now() - input.sequence * 12 * 60 * 60 * 1000);
    const items = shuffle(input.foods)
        .slice(0, randomInt(1, Math.min(3, input.foods.length)))
        .map((food) => {
        const quantity = randomInt(1, 3);
        return {
            foodId: food._id,
            quantity,
            price: food.finalPriceTag,
            platformFee: 0.5,
            baseRevenue: food.baseRevenue,
            serviceFee: food.serviceFee,
        };
    });
    const subtotal = roundTo2(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
    const platformFee = roundTo2(items.reduce((sum, item) => sum + item.platformFee * item.quantity, 0));
    const stateTax = roundTo2(subtotal * (input.stateTaxRate / 100));
    const vendorAmount = roundTo2(items.reduce((sum, item) => sum + ((item.baseRevenue - item.platformFee) + item.serviceFee) * item.quantity, 0));
    const totalPrice = roundTo2(subtotal + stateTax);
    return {
        orderId: `ORD-SEED-${String(1000 + input.sequence)}`,
        providerId: input.providerId,
        customerId: input.customerId,
        items: items.map((item) => ({
            foodId: item.foodId,
            quantity: item.quantity,
            price: item.price,
            platformFee: item.platformFee,
        })),
        subtotal,
        platformFee,
        stateTax,
        totalPrice,
        vendorAmount,
        status: input.status,
        paymentStatus: input.paymentStatus,
        paymentMethod: pickRandom(['card', 'apple_pay', 'google_pay']),
        logisticsType: pickRandom(['pickup', 'delivery']),
        pickupTime: new Date(createdAt.getTime() + 75 * 60 * 1000),
        state: input.stateCode,
        orderStatusHistory: buildOrderHistory(input.status, createdAt),
        createdAt,
        updatedAt: new Date(createdAt.getTime() + 90 * 60 * 1000),
        cancellationReason: input.status === order_model_1.OrderStatus.CANCELLED ? 'Customer changed plans' : undefined,
    };
};
const seedOrders = (providerIds, customerIds, foods, stateTaxByCode) => __awaiter(void 0, void 0, void 0, function* () {
    const foodsByProvider = providerIds.map((providerId) => foods
        .filter((food) => String(food.providerId) === providerId.toString())
        .map((food) => ({
        _id: toObjectId(food._id),
        baseRevenue: food.baseRevenue,
        serviceFee: food.serviceFee,
        finalPriceTag: food.finalPriceTag,
    })));
    const orderStates = [
        order_model_1.OrderStatus.COMPLETED,
        order_model_1.OrderStatus.COMPLETED,
        order_model_1.OrderStatus.PREPARING,
        order_model_1.OrderStatus.PENDING,
    ];
    const orderDocs = providerIds.flatMap((providerId, providerIndex) => {
        const stateCode = PROVIDERS[providerIndex].state;
        const stateTaxRate = stateTaxByCode.get(stateCode) || 0;
        return orderStates.map((status, localIndex) => {
            const globalSequence = providerIndex * orderStates.length + localIndex + 1;
            const paymentStatus = status === order_model_1.OrderStatus.PENDING
                ? order_model_1.PaymentStatus.PENDING
                : status === order_model_1.OrderStatus.CANCELLED
                    ? order_model_1.PaymentStatus.FAILED
                    : order_model_1.PaymentStatus.PAID;
            return createOrderDoc({
                providerId,
                customerId: customerIds[(providerIndex + localIndex) % customerIds.length],
                foods: foodsByProvider[providerIndex],
                stateCode,
                stateTaxRate,
                sequence: globalSequence,
                status,
                paymentStatus,
            });
        });
    });
    const orders = yield order_model_1.Order.insertMany(orderDocs);
    return orders;
});
const seedPayments = (orders) => __awaiter(void 0, void 0, void 0, function* () {
    const paymentDocs = orders.map((order, index) => ({
        paymentId: `PAY-SEED-${String(2000 + index)}`,
        orderId: order.orderId,
        orderObjectId: toObjectId(order._id),
        providerId: toObjectId(order.providerId),
        customerId: toObjectId(order.customerId),
        totalAmount: order.totalPrice,
        commission: order.platformFee,
        netAmount: order.vendorAmount,
        vendorAmount: order.vendorAmount,
        status: order.paymentStatus === order_model_1.PaymentStatus.PAID
            ? payment_model_1.PaymentStatus.COMPLETED
            : order.paymentStatus === order_model_1.PaymentStatus.FAILED
                ? payment_model_1.PaymentStatus.FAILED
                : payment_model_1.PaymentStatus.PENDING,
        payoutStatus: order.paymentStatus === order_model_1.PaymentStatus.PAID ? payment_model_1.PayoutStatus.SETTLED : payment_model_1.PayoutStatus.PENDING,
        paymentMethod: order.paymentMethod,
        stripePaymentIntentId: `pi_seed_${3000 + index}`,
        stripeChargeId: `ch_seed_${4000 + index}`,
        stripeTransferId: order.paymentStatus === order_model_1.PaymentStatus.PAID ? `tr_seed_${5000 + index}` : undefined,
        createdAt: order.createdAt,
        updatedAt: order.createdAt,
    }));
    yield payment_model_1.Payment.insertMany(paymentDocs);
});
const seedReviews = (orders) => __awaiter(void 0, void 0, void 0, function* () {
    const completedOrders = orders.filter((order) => order.status === order_model_1.OrderStatus.COMPLETED);
    const reviewPool = [
        'Fresh, flavorful, and arrived right on time.',
        'Really solid portion size and the taste was on point.',
        'One of the best meals I have ordered this week.',
        'Great texture, balanced seasoning, and nicely packed.',
        'Would definitely order this again for lunch.',
    ];
    const reviewDocs = completedOrders.flatMap((order, orderIndex) => order.items.slice(0, Math.min(2, order.items.length)).map((item, itemIndex) => ({
        providerId: toObjectId(order.providerId),
        customerId: toObjectId(order.customerId),
        orderId: toObjectId(order._id),
        foodId: item.foodId,
        rating: 4 + ((orderIndex + itemIndex) % 2),
        comment: reviewPool[(orderIndex + itemIndex) % reviewPool.length],
        createdAt: new Date(order.createdAt.getTime() + (itemIndex + 2) * 60 * 60 * 1000),
        updatedAt: new Date(order.createdAt.getTime() + (itemIndex + 3) * 60 * 60 * 1000),
    })));
    const reviews = yield review_model_1.Review.insertMany(reviewDocs);
    return reviews;
});
const syncFoodRatings = () => __awaiter(void 0, void 0, void 0, function* () {
    const ratings = yield review_model_1.Review.aggregate([
        { $match: { foodId: { $ne: null } } },
        { $group: { _id: '$foodId', average: { $avg: '$rating' } } },
    ]);
    if (ratings.length === 0) {
        return;
    }
    yield food_model_1.Food.bulkWrite(ratings.map((entry) => ({
        updateOne: {
            filter: { _id: entry._id },
            update: { $set: { rating: roundTo2(entry.average) } },
        },
    })));
});
const seedFavoritesAndCarts = (customerIds, foods) => __awaiter(void 0, void 0, void 0, function* () {
    const shuffledFoods = shuffle(foods);
    const favoriteDocs = customerIds.flatMap((customerId, customerIndex) => shuffledFoods.slice(customerIndex, customerIndex + 4).map((food) => ({
        userId: customerId,
        foodId: toObjectId(food._id),
    })));
    yield favorite_model_1.Favorite.insertMany(favoriteDocs);
    const cartDocs = customerIds.slice(0, 4).map((customerId, customerIndex) => {
        const cartFoods = shuffledFoods.slice(customerIndex * 2, customerIndex * 2 + 2);
        const items = cartFoods.map((food, itemIndex) => ({
            foodId: toObjectId(food._id),
            quantity: itemIndex + 1,
            price: food.finalPriceTag,
        }));
        return {
            userId: customerId,
            items,
            subtotal: roundTo2(items.reduce((sum, item) => sum + item.price * item.quantity, 0)),
        };
    });
    yield cart_model_1.Cart.insertMany(cartDocs);
});
const seedPaymentMethods = (customerIds) => __awaiter(void 0, void 0, void 0, function* () {
    const brands = [paymentMethod_model_1.CardBrand.VISA, paymentMethod_model_1.CardBrand.MASTERCARD, paymentMethod_model_1.CardBrand.AMEX, paymentMethod_model_1.CardBrand.DISCOVER];
    const docs = customerIds.map((customerId, index) => ({
        userId: customerId,
        cardholderName: CUSTOMERS[index].fullName,
        brand: brands[index % brands.length],
        last4: String(4242 + index).slice(-4),
        expiryDate: `0${(index % 8) + 1}/2${7 + (index % 3)}`,
        isDefault: true,
        stripePaymentMethodId: `pm_seed_${6000 + index}`,
    }));
    yield paymentMethod_model_1.PaymentMethod.insertMany(docs);
});
const seedNotifications = (adminId, providerIds, customerIds, orders) => __awaiter(void 0, void 0, void 0, function* () {
    const notifications = orders.flatMap((order, index) => [
        {
            userId: toObjectId(order.customerId),
            type: notification_model_1.NotificationType.ORDER,
            orderId: toObjectId(order._id),
            orderStatus: order.status,
            title: 'Order update',
            message: `Your order ${order.orderId} is currently ${order.status}.`,
            isRead: index % 3 === 0,
        },
        {
            userId: toObjectId(order.providerId),
            type: notification_model_1.NotificationType.ORDER,
            orderId: toObjectId(order._id),
            orderStatus: order.status,
            title: 'New order activity',
            message: `Order ${order.orderId} is visible in your dashboard.`,
            isRead: index % 4 === 0,
        },
    ]);
    notifications.push({
        userId: adminId,
        type: notification_model_1.NotificationType.SYSTEM,
        title: 'Seed data refreshed',
        message: 'Demo database seeding completed successfully.',
        isRead: false,
    });
    notifications.push({
        userId: customerIds[0],
        type: notification_model_1.NotificationType.SYSTEM,
        title: 'Welcome offer',
        message: 'Use the seeded account to explore menus, orders, and favorites.',
        isRead: false,
    });
    notifications.push({
        userId: providerIds[0],
        type: notification_model_1.NotificationType.SYSTEM,
        title: 'Store ready',
        message: 'Your seeded provider account now has categories, foods, and orders.',
        isRead: false,
    });
    yield notification_model_1.Notification.insertMany(notifications);
});
const seedBanners = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const banners = BANNER_IMAGE_POOL.map((bannerImage, index) => ({
        title: `Seed: Featured Campaign ${index + 1}`,
        bannerImage,
        startTime: new Date(now.getTime() - index * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + (10 + index) * 24 * 60 * 60 * 1000),
        status: banner_model_1.BannerStatus.ACTIVE,
        isDeleted: false,
    }));
    yield banner_model_1.Banner.insertMany(banners);
});
const seedSystemConfigs = () => __awaiter(void 0, void 0, void 0, function* () {
    yield systemConfig_model_1.SystemConfig.insertMany([
        {
            key: 'seed.platformFeePerItem',
            value: 0.5,
            description: 'Sample platform fee used by the demo seed data.',
        },
        {
            key: 'seed.supportEmail',
            value: 'support@seed.foodapp.local',
            description: 'Sample support email for local demo usage.',
        },
        {
            key: 'seed.currency',
            value: 'USD',
            description: 'Sample display currency for the demo data set.',
        },
    ]);
});
const runSeeder = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Connecting to database...');
        yield (0, db_1.default)();
        console.log('Seeding states...');
        yield stateSeeder_service_1.default.seedStates();
        console.log('Preparing users...');
        const { admin, providers, customers } = yield buildUsers();
        const adminId = toObjectId(admin._id);
        const providerIds = providers.map((provider) => toObjectId(provider._id));
        const customerIds = customers.map((customer) => toObjectId(customer._id));
        console.log('Refreshing old seed data...');
        yield clearExistingSeedData(adminId, providerIds, customerIds);
        console.log('Creating profiles, menus, and media...');
        yield seedProfiles(adminId, customerIds);
        yield seedProviderProfiles(providerIds);
        const categories = yield seedCategories(providerIds);
        const foods = yield seedFoods(categories.map((category) => ({
            _id: category._id,
            providerId: category.providerId,
            categoryName: category.categoryName,
        })));
        const states = yield state_model_1.State.find({ code: { $in: PROVIDERS.map((provider) => provider.state) } }).lean();
        const stateTaxByCode = new Map(states.map((state) => [state.code, Number(state.tax || 0)]));
        console.log('Generating orders, payments, and reviews...');
        const orders = yield seedOrders(providerIds, customerIds, foods.map((food) => ({
            _id: food._id,
            providerId: food.providerId,
            baseRevenue: food.baseRevenue,
            serviceFee: food.serviceFee,
            finalPriceTag: food.finalPriceTag,
        })), stateTaxByCode);
        yield seedPayments(orders.map((order) => ({
            _id: order._id,
            orderId: order.orderId,
            providerId: order.providerId,
            customerId: order.customerId,
            totalPrice: order.totalPrice,
            platformFee: order.platformFee,
            vendorAmount: order.vendorAmount,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt,
        })));
        yield seedReviews(orders.map((order) => ({
            _id: order._id,
            providerId: order.providerId,
            customerId: order.customerId,
            items: order.items,
            status: order.status,
            createdAt: order.createdAt,
        })));
        yield syncFoodRatings();
        console.log('Creating favorites, carts, cards, banners, and notifications...');
        yield seedFavoritesAndCarts(customerIds, foods.map((food) => ({
            _id: food._id,
            finalPriceTag: food.finalPriceTag,
        })));
        yield seedPaymentMethods(customerIds);
        yield seedNotifications(adminId, providerIds, customerIds, orders.map((order) => ({
            _id: order._id,
            orderId: order.orderId,
            providerId: order.providerId,
            customerId: order.customerId,
            status: order.status,
        })));
        yield seedBanners();
        yield seedSystemConfigs();
        console.log('');
        console.log('Seed completed successfully.');
        console.log(`Admin login: admin@seed.foodapp.local / ${SEED_PASSWORD}`);
        console.log(`Providers created: ${providers.length}`);
        console.log(`Customers created: ${customers.length}`);
        console.log(`Categories created: ${categories.length}`);
        console.log(`Foods created with images: ${foods.length}`);
        console.log(`Orders created: ${orders.length}`);
        process.exit(0);
    }
    catch (error) {
        console.error('Database seeding failed:', error);
        process.exit(1);
    }
});
runSeeder();
