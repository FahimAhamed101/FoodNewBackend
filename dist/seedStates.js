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
const db_1 = __importDefault(require("./database/db"));
const stateSeeder_service_1 = __importDefault(require("./services/stateSeeder.service"));
const runSeeder = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🚀 Connecting to database...');
        yield (0, db_1.default)();
        console.log('✅ Database connected successfully\n');
        yield stateSeeder_service_1.default.seedStates();
        console.log('\n✅ Seeding completed successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
});
runSeeder();
