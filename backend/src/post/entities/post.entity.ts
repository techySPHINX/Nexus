export class Post {
  id: string;
  authorId: string;
  subject: string;
  content: string;
  imageUrl?: string;
  type?: string;
  createdAt: Date;
}
