"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingController = void 0;
const common_1 = require("@nestjs/common");
const messaging_service_1 = require("./messaging.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const get_current_user_decorator_1 = require("../common/decorators/get-current-user.decorator");
const create_message_dto_1 = require("./dto/create-message.dto");
const filter_messages_dto_1 = require("./dto/filter-messages.dto");
let MessagingController = class MessagingController {
    constructor(messagingService) {
        this.messagingService = messagingService;
    }
    sendMessage(senderId, dto) {
        return this.messagingService.sendMessage(senderId, dto);
    }
    getConversation(userId, otherUserId, dto) {
        return this.messagingService.getConversation(userId, otherUserId, dto);
    }
    getAllConversations(userId) {
        return this.messagingService.getAllConversations(userId);
    }
};
exports.MessagingController = MessagingController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, get_current_user_decorator_1.GetCurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_message_dto_1.CreateMessageDto]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('conversation/:otherUserId'),
    __param(0, (0, get_current_user_decorator_1.GetCurrentUser)('userId')),
    __param(1, (0, common_1.Param)('otherUserId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, filter_messages_dto_1.FilterMessagesDto]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "getConversation", null);
__decorate([
    (0, common_1.Get)('conversations/all'),
    __param(0, (0, get_current_user_decorator_1.GetCurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MessagingController.prototype, "getAllConversations", null);
exports.MessagingController = MessagingController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('messages'),
    __metadata("design:paramtypes", [messaging_service_1.MessagingService])
], MessagingController);
//# sourceMappingURL=messaging.controller.js.map