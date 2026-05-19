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
const state_model_1 = require("../models/state.model");
const usa_states_json_1 = __importDefault(require("../data/usa-states.json"));
class StateSeeder {
    seedStates() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('🌱 Starting state seeding process...');
            let inserted = 0;
            let skipped = 0;
            let errors = 0;
            try {
                for (const stateData of usa_states_json_1.default) {
                    try {
                        const result = yield state_model_1.State.findOneAndUpdate({
                            code: stateData.code.toUpperCase(),
                            country: stateData.country.toUpperCase(),
                        }, {
                            name: stateData.name,
                            code: stateData.code.toUpperCase(),
                            country: stateData.country.toUpperCase(),
                            tax: Number(stateData.Tax || 0),
                            isActive: true,
                        }, {
                            upsert: true,
                            new: true,
                            runValidators: true,
                        });
                        if (result) {
                            // Check if this was a new insert or existing document
                            const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
                            if (isNew) {
                                inserted++;
                                console.log(`✅ Inserted: ${stateData.name} (${stateData.code})`);
                            }
                            else {
                                skipped++; // Reusing skipped for updated in logs for now, or I could add a new counter
                                console.log(`🔄 Updated: ${stateData.name} (${stateData.code})`);
                            }
                        }
                    }
                    catch (error) {
                        errors++;
                        console.error(`❌ Error seeding ${stateData.name}:`, error.message);
                    }
                }
                console.log('\n📊 Seeding Summary:');
                console.log(`   ✅ Inserted: ${inserted}`);
                console.log(`   ⏭️  Skipped: ${skipped}`);
                console.log(`   ❌ Errors: ${errors}`);
                console.log(`   📝 Total: ${usa_states_json_1.default.length}`);
                return {
                    success: true,
                    inserted,
                    skipped,
                    errors,
                    total: usa_states_json_1.default.length,
                };
            }
            catch (error) {
                console.error('❌ Fatal error during seeding:', error);
                throw error;
            }
        });
    }
    getAllStates() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield state_model_1.State.find({ isActive: true }).sort({ name: 1 }).lean();
        });
    }
    getStateByCode(code) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield state_model_1.State.findOne({
                code: code.toUpperCase(),
                isActive: true,
            }).lean();
        });
    }
}
exports.default = new StateSeeder();
