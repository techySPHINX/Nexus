'''import {
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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { FilesService } from 'src/files/files.service';

@ApiTags('posts')
@ApiBearerAuth()
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

  '''@Get('feed')
  @ApiOperation({ summary: 'Get the user's feed' })
  @ApiResponse({ status: 200, description: 'The user's feed.' })
  getFeed(
    @GetCurrentUser('sub') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.postService.getFeed(userId, page, limit);
  }'''

  @Get('pending')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all pending posts (for admins)' })
  @ApiResponse({ status: 200, description: 'List of all pending posts.' })
  getPendingPosts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.postService.getPendingPosts(page, limit);
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

  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Approve a post by id (for admins)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Post approved successfully.' })
  approvePost(@Param('id') id: string) {
    return this.postService.approvePost(id);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reject a post by id (for admins)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Post rejected successfully.' })
  rejectPost(@Param('id') id: string) {
    return this.postService.rejectPost(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post by id (only by author)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Post deleted successfully.' })
  remove(@Param('id') id: string, @GetCurrentUser('sub') userId: string) {
    return this.postService.remove(id, userId);
  }
}
'''
