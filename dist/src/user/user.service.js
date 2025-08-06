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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcryptjs_1 = require("bcryptjs");
let UserService = class UserService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.user.findMany({
            include: {
                profile: {
                    include: {
                        skills: true
                    }
                }
            },
        });
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                profile: {
                    include: {
                        skills: true
                    }
                }
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async update(id, dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            throw new common_1.NotFoundException('User not found');
        }
        const { name, password, bio, location, interests, skills } = dto;
        const userUpdateData = {};
        if (name)
            userUpdateData.name = name;
        if (password) {
            if (password.length < 6) {
                throw new common_1.BadRequestException('Password must be at least 6 characters long');
            }
            userUpdateData.password = await (0, bcryptjs_1.hash)(password, 10);
        }
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: userUpdateData,
        });
        let skillConnections = [];
        if (skills && skills.length > 0) {
            const skillPromises = skills.map(async (skillName) => {
                let skill = await this.prisma.skill.findFirst({
                    where: { name: skillName },
                });
                if (!skill) {
                    skill = await this.prisma.skill.create({
                        data: { name: skillName },
                    });
                }
                return skill;
            });
            const createdSkills = await Promise.all(skillPromises);
            skillConnections = createdSkills.map((skill) => ({ id: skill.id }));
        }
        const profile = await this.prisma.profile.upsert({
            where: { userId: id },
            create: {
                userId: id,
                bio,
                location,
                interests,
                skills: {
                    connect: skillConnections,
                },
            },
            update: {
                bio,
                location,
                interests,
                skills: {
                    set: skillConnections,
                },
            },
            include: {
                skills: true
            },
        });
        return {
            ...updatedUser,
            profile
        };
    }
    async remove(id) {
        const existingUser = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.prisma.profile.deleteMany({
            where: { userId: id }
        });
        return this.prisma.user.delete({
            where: { id }
        });
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map