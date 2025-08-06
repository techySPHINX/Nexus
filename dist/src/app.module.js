"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const user_module_1 = require("./user/user.module");
const connection_service_1 = require("./connection/connection.service");
const connection_controller_1 = require("./connection/connection.controller");
const connection_module_1 = require("./connection/connection.module");
const messaging_service_1 = require("./messaging/messaging.service");
const messaging_controller_1 = require("./messaging/messaging.controller");
const messaging_module_1 = require("./messaging/messaging.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            connection_module_1.ConnectionModule,
            messaging_module_1.MessagingModule,
        ],
        controllers: [app_controller_1.AppController, connection_controller_1.ConnectionController, messaging_controller_1.MessagingController],
        providers: [app_service_1.AppService, connection_service_1.ConnectionService, messaging_service_1.MessagingService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map