import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post(':userId')
  create(@Param('userId') userId: string, @Body() dto: CreatePostDto) {
    return this.postService.create(userId, dto);
  }

  @Get()
  findAll() {
    return this.postService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.postService.findByUser(userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postService.remove(id);
  }
}
