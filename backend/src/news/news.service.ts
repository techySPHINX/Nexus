import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async list(p: { skip?: number; take?: number } = {}) {
    const { skip = 0, take = 20 } = p;
    return this.prisma.news.findMany({
      orderBy: { publishedAt: 'desc' },
      skip,
      take,
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.news.findUnique({ where: { slug } });
  }

  private slugify(text: string) {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^a-z0-9-]/g, '') // Remove invalid chars
      .replace(/--+/g, '-') // Collapse dashes
      .replace(/^-+|-+$/g, ''); // Trim dashes
  }

  async create(data: Partial<Prisma.NewsCreateInput>) {
    const createData: any = { ...data };

    // Ensure slug is generated server-side and is unique
    if (!createData.slug && createData.title) {
      const base = this.slugify(String(createData.title));
      let candidate = base;
      let i = 1;
      while (true) {
        const existing = await this.prisma.news.findUnique({ where: { slug: candidate } });
        if (!existing) break;
        candidate = `${base}-${i++}`;
      }
      createData.slug = candidate;
    }

    return this.prisma.news.create({ data: createData as Prisma.NewsCreateInput });
  }

  async update(id: string, data: Partial<Prisma.NewsCreateInput>) {
    return this.prisma.news.update({ where: { id }, data: data as any });
  }

  async remove(id: string) {
    return this.prisma.news.delete({ where: { id } });
  }
}
