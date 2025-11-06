import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubCommunityTypeService {
  constructor(private prisma: PrismaService) {}

  async listTypes() {
    console.log('Listing sub-community types');
  // Fetch ascending by name, but ensure the special placeholder type
  // 'OTHER' appears at the end of the list for UI clarity.
    // Optimization: fetch regular types (excluding the special 'OTHER')
    // ordered ascending, then fetch the 'OTHER' type once and append it
    // if present. This avoids fetching and filtering the entire set in JS.
    const regular = await this.prisma.subCommunityType.findMany({
      where: { name: { not: 'OTHER', mode: 'insensitive' } },
      orderBy: { name: 'asc' },
    });

    const other = await this.prisma.subCommunityType.findFirst({
      where: { name: { equals: 'OTHER', mode: 'insensitive' } },
    });

    return other ? [...regular, other] : regular;
  }

  async getTypeById(id: string) {
    const type = await this.prisma.subCommunityType.findUnique({ where: { id } });
    if (!type) throw new NotFoundException('SubCommunity type not found');
    return type;
  }

  async createType(data: { name: string; slug?: string; description?: string }) {
    return this.prisma.subCommunityType.create({ data });
  }

  async updateType(id: string, data: { name?: string; slug?: string; description?: string }) {
    const existing = await this.prisma.subCommunityType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('SubCommunity type not found');
    return this.prisma.subCommunityType.update({ where: { id }, data });
  }

  async deleteType(id: string) {
    const existing = await this.prisma.subCommunityType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('SubCommunity type not found');
    return this.prisma.subCommunityType.delete({ where: { id } });
  }
}
