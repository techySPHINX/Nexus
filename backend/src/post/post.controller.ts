import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { FilesService } from 'src/files/files.service';

@ApiTags('posts')
@Controller('posts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly filesService: FilesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a post for the current user' })
  @ApiBody({ type: CreatePostDto })
  @ApiResponse({ status: 201, description: 'Post created successfully.' })
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @GetCurrentUser('sub') userId: string,
    @Body() dto: CreatePostDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    let imageUrl: string | undefined;
    if (image) {
      imageUrl = await this.filesService.saveFile(image);
    }

    return this.postService.create(userId, {
      ...dto,
      imageUrl: imageUrl,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts' })
  @ApiResponse({ status: 200, description: 'List of all posts.' })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: string,
  ) {
    return this.postService.findAll(page, limit, type);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get posts by user' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, description: 'List of posts by user.' })
  findByUser(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.postService.findByUser(userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single post by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Post found.' })
  findOne(@Param('id') id: string, @GetCurrentUser('sub') userId: string) {
    return this.postService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a post by id (only by author)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdatePostDto })
  @ApiResponse({ status: 200, description: 'Post updated successfully.' })
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
    @Body() dto: UpdatePostDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    let imageUrl: string | undefined;
    if (image) {
      imageUrl = await this.filesService.saveFile(image);
    }

    return this.postService.update(id, userId, {
      ...dto,
      imageUrl: imageUrl,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post by id (only by author)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Post deleted successfully.' })
  remove(@Param('id') id: string, @GetCurrentUser('sub') userId: string) {
    return this.postService.remove(id, userId);
  }
}
