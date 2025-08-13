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

/**
 * Controller for handling post-related operations.
 * Provides endpoints for creating, retrieving, updating, and deleting posts.
 * Also includes functionalities for post moderation (approve/reject) by admins.
 */
@ApiTags('posts')
@ApiBearerAuth()
@Controller('posts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly filesService: FilesService,
  ) {}

  /**
   * Creates a new post for the current authenticated user.
   * An optional image can be uploaded with the post.
   * @param userId - The ID of the current user (extracted from JWT).
   * @param dto - The data for creating the post.
   * @param image - The uploaded image file (optional).
   * @returns A promise that resolves to the created post.
   */
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

  /**
   * Retrieves the personalized feed for the current authenticated user.
   * @param userId - The ID of the current user (extracted from JWT).
   * @param page - The page number for pagination (defaults to 1).
   * @param limit - The number of posts per page (defaults to 10).
   * @returns A promise that resolves to an array of posts for the user's feed.
   */
  @Get('feed')
  @ApiOperation({ summary: "Get the user's feed" })
  @ApiResponse({ status: 200, description: "The user's feed." })
  getFeed(
    @GetCurrentUser('sub') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = page ?? 1;
    const limitNum = limit ?? 10;
    return this.postService.getFeed(userId, pageNum, limitNum);
  }

  /**
   * Retrieves all posts that are pending approval. Only accessible by ADMINs.
   * @param page - The page number for pagination (defaults to 1).
   * @param limit - The number of posts per page (defaults to 10).
  @Get('pending')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all pending posts (for admins)' })
  @ApiResponse({ status: 200, description: 'List of all pending posts.' })
  getPendingPosts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = page ?? 1;
    const limitNum = limit ?? 10;
    return this.postService.getPendingPosts(pageNum, limitNum);
  }
    return this.postService.getPendingPosts(page, limit);
  }

  /**
   * Retrieves all posts created by a specific user.
   * @param userId - The ID of the user whose posts are to be retrieved.
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get posts by user' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, description: 'List of posts by user.' })
  findByUser(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = page ?? 1;
    const limitNum = limit ?? 10;
    return this.postService.findByUser(userId, pageNum, limitNum);
  }
    @Query('limit') limit: number = 10,
  ) {
    return this.postService.findByUser(userId, page, limit);
  }

  /**
   * Retrieves a single post by its ID.
   * @param id - The ID of the post to retrieve.
   * @param userId - The ID of the current user (for authorization checks).
   * @returns A promise that resolves to the post object.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single post by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Post found.' })
  findOne(@Param('id') id: string, @GetCurrentUser('sub') userId: string) {
    return this.postService.findOne(id, userId);
  }

  /**
   * Updates an existing post. Only the author of the post can update it.
   * An optional new image can be uploaded.
   * @param id - The ID of the post to update.
   * @param userId - The ID of the current user (extracted from JWT).
   * @param dto - The data to update the post with.
   * @param image - The new image file (optional).
   * @returns A promise that resolves to the updated post.
   */
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

  /**
   * Approves a pending post. Only accessible by ADMINs.
   * @param id - The ID of the post to approve.
   * @returns A promise that resolves when the post has been approved.
   */
  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Approve a post by id (for admins)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Post approved successfully.' })
  approvePost(@Param('id') id: string) {
    return this.postService.approvePost(id);
  }

  /**
   * Rejects a pending post. Only accessible by ADMINs.
   * @param id - The ID of the post to reject.
   * @returns A promise that resolves when the post has been rejected.
   */
  @Patch(':id/reject')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reject a post by id (for admins)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Post rejected successfully.' })
  rejectPost(@Param('id') id: string) {
    return this.postService.rejectPost(id);
  }

  /**
   * Deletes a post. Only the author of the post can delete it.
   * @param id - The ID of the post to delete.
   * @param userId - The ID of the current user (extracted from JWT).
   * @returns A promise that resolves when the post has been deleted.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post by id (only by author)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Post deleted successfully.' })
  remove(@Param('id') id: string, @GetCurrentUser('sub') userId: string) {
    return this.postService.remove(id, userId);
  }
}
