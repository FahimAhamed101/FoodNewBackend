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
exports.validate = void 0;
const zod_1 = require("zod");
const AppError_1 = __importDefault(require("../utils/AppError"));
const validate = (schema) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const parsed = yield schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            if (parsed.body)
                Object.assign(req.body, parsed.body);
            if (parsed.query)
                Object.assign(req.query, parsed.query);
            if (parsed.params)
                Object.assign(req.params, parsed.params);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const message = error.issues.map((i) => i.message).join(', ');
                const validationError = new AppError_1.default(message, 400, 'VALIDATION_ERROR');
                validationError.details = error.issues;
                return next(validationError);
            }
            next(error);
        }
    });
};
exports.validate = validate;
