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
exports.ConnectionController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const connection_service_1 = require("./connection.service");
const connection_dto_1 = require("./dto/connection.dto");
let ConnectionController = class ConnectionController {
    constructor(connectionService) {
        this.connectionService = connectionService;
    }
    sendRequest(dto, req) {
        return this.connectionService.sendRequest(req.user.userId, dto.recipientId);
    }
    updateStatus(dto, req) {
        return this.connectionService.updateStatus(req.user.userId, dto);
    }
    getConnections(req) {
        return this.connectionService.getConnections(req.user.userId);
    }
    getPending(req) {
        return this.connectionService.getPendingRequests(req.user.userId);
    }
};
exports.ConnectionController = ConnectionController;
__decorate([
    (0, common_1.Post)('send'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [connection_dto_1.CreateConnectionDto, Object]),
    __metadata("design:returntype", void 0)
], ConnectionController.prototype, "sendRequest", null);
__decorate([
    (0, common_1.Patch)('status'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [connection_dto_1.UpdateConnectionStatusDto, Object]),
    __metadata("design:returntype", void 0)
], ConnectionController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ConnectionController.prototype, "getConnections", null);
__decorate([
    (0, common_1.Get)('pending'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ConnectionController.prototype, "getPending", null);
exports.ConnectionController = ConnectionController = __decorate([
    (0, common_1.Controller)('connection'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [connection_service_1.ConnectionService])
], ConnectionController);
//# sourceMappingURL=connection.controller.js.map