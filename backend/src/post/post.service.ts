import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        ...dto,
        authorId: userId,
      },
    });
  }

  async findAll() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profile: {
              select: { bio: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdatePostDto) {
    return this.prisma.post.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }
}
