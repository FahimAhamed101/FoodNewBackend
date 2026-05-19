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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const resend_1 = require("resend");
const config_1 = __importDefault(require("../config"));
const AppError_1 = __importDefault(require("./AppError"));
const resendClient = ((_a = config_1.default.resend) === null || _a === void 0 ? void 0 : _a.apiKey) ? new resend_1.Resend(config_1.default.resend.apiKey) : null;
const extractOtp = (message) => {
    const explicitMatch = message.match(/verification\s*code\s*is[:\s]+(\d{4,8})/i);
    if (explicitMatch === null || explicitMatch === void 0 ? void 0 : explicitMatch[1])
        return explicitMatch[1];
    const genericMatch = message.match(/\b(\d{6})\b/);
    if (genericMatch === null || genericMatch === void 0 ? void 0 : genericMatch[1])
        return genericMatch[1];
    return null;
};
const logDevOtpIfPresent = (options, context) => {
    if (config_1.default.env === 'production')
        return;
    const otp = extractOtp(options.message || '');
    if (!otp)
        return;
    console.log(`[DEV][OTP][${context}] email=${options.email} otp=${otp}`);
};
const renderMockEmail = (options) => {
    console.log('-----------------------------------------');
    console.log('Email [DEVELOPMENT MODE] Mock:');
    console.log(`To:      ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: ${options.message}`);
    if (options.html)
        console.log('HTML:    [Rich Content Provided]');
    logDevOtpIfPresent(options, 'MOCK');
    console.log('-----------------------------------------');
};
const buildHtml = (options) => {
    if (options.html)
        return options.html;
    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <p>${options.message.replace(/\n/g, '<br/>')}</p>
    </div>
  `;
};
const sendViaResend = (options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!resendClient) {
        throw new AppError_1.default('Resend is not configured. Missing RESEND_API_KEY.', 500, 'EMAIL_CONFIG_MISSING');
    }
    if (!((_a = config_1.default.resend) === null || _a === void 0 ? void 0 : _a.fromEmail)) {
        throw new AppError_1.default('Resend sender email is not configured. Missing RESEND_FROM_EMAIL.', 500, 'EMAIL_CONFIG_MISSING');
    }
    const { data, error } = yield resendClient.emails.send({
        from: `${config_1.default.resend.fromName} <${config_1.default.resend.fromEmail}>`,
        to: [options.email],
        subject: options.subject,
        text: options.message,
        html: buildHtml(options),
    });
    if (error) {
        throw new AppError_1.default(error.message || 'Failed to send email via Resend API', 502, 'EMAIL_DELIVERY_FAILED');
    }
    return data;
});
const sendViaSmtp = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = nodemailer_1.default.createTransport({
        host: config_1.default.email.host,
        port: Number(config_1.default.email.port),
        secure: Boolean(config_1.default.email.secure), // true for 465, false for 587
        auth: {
            user: config_1.default.email.user,
            pass: config_1.default.email.pass,
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
    });
    yield transporter.verify();
    yield transporter.sendMail({
        from: `${config_1.default.email.fromName} <${config_1.default.email.fromEmail}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: buildHtml(options),
    });
});
const sendEmail = (options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    console.log(`[DEBUG] Attempting to send email to: ${options.email} with subject: ${options.subject}`);
    const hasResendConfig = Boolean(((_a = config_1.default.resend) === null || _a === void 0 ? void 0 : _a.apiKey) && ((_b = config_1.default.resend) === null || _b === void 0 ? void 0 : _b.fromEmail));
    const hasSmtpConfig = Boolean(((_c = config_1.default.email) === null || _c === void 0 ? void 0 : _c.host) &&
        ((_d = config_1.default.email) === null || _d === void 0 ? void 0 : _d.port) &&
        ((_e = config_1.default.email) === null || _e === void 0 ? void 0 : _e.user) &&
        ((_f = config_1.default.email) === null || _f === void 0 ? void 0 : _f.pass) &&
        ((_g = config_1.default.email) === null || _g === void 0 ? void 0 : _g.fromEmail));
    if (!hasResendConfig && !hasSmtpConfig && config_1.default.env !== 'production') {
        renderMockEmail(options);
        return;
    }
    if (!hasResendConfig && !hasSmtpConfig) {
        throw new AppError_1.default('Email service is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL, or valid SMTP settings.', 500, 'EMAIL_CONFIG_MISSING');
    }
    // Prefer Resend API first
    if (hasResendConfig) {
        try {
            yield sendViaResend(options);
            console.log(`Email sent to ${options.email} via Resend API`);
            logDevOtpIfPresent(options, 'RESEND_SUCCESS');
            return;
        }
        catch (error) {
            console.error('Resend API failed:', error);
            // Only fallback to SMTP if SMTP is intentionally configured
            if (hasSmtpConfig) {
                try {
                    yield sendViaSmtp(options);
                    console.log(`Email sent to ${options.email} via SMTP fallback`);
                    logDevOtpIfPresent(options, 'SMTP_FALLBACK_SUCCESS');
                    return;
                }
                catch (smtpError) {
                    console.error('SMTP fallback failed:', smtpError);
                }
            }
            if (config_1.default.env === 'production') {
                throw new AppError_1.default((error === null || error === void 0 ? void 0 : error.message) || 'Failed to send email. Please try again later.', 502, 'EMAIL_DELIVERY_FAILED');
            }
            console.log('[DEV ERROR] Email provider failed but continuing because of development mode.');
            renderMockEmail(options);
            logDevOtpIfPresent(options, 'DELIVERY_FAILED_DEV_FALLBACK');
            return;
        }
    }
    // SMTP only path
    try {
        yield sendViaSmtp(options);
        console.log(`Email sent to ${options.email} via SMTP`);
        logDevOtpIfPresent(options, 'SMTP_SUCCESS');
    }
    catch (error) {
        console.error('SMTP failed:', error);
        if (config_1.default.env === 'production') {
            throw new AppError_1.default((error === null || error === void 0 ? void 0 : error.message) || 'Failed to send email. Please try again later.', 502, 'EMAIL_DELIVERY_FAILED');
        }
        console.log('[DEV ERROR] SMTP failed but continuing because of development mode.');
        renderMockEmail(options);
        logDevOtpIfPresent(options, 'SMTP_FAILED_DEV_FALLBACK');
    }
});
exports.sendEmail = sendEmail;
