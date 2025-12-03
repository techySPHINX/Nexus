import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  async list(@Query('skip') skip?: string, @Query('take') take?: string) {
    const s = skip ? parseInt(skip, 10) : 0;
    const t = take ? parseInt(take, 10) : 20;
    return this.newsService.list({ skip: s, take: t });
  }

  @Get(':slug')
  async find(@Param('slug') slug: string) {
    return this.newsService.findBySlug(slug);
  }

  @Post()
  async create(@Body() body: CreateNewsDto) {
    return this.newsService.create(body as any);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateNewsDto) {
    return this.newsService.update(id, body as any);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.newsService.remove(id);
  }
}
