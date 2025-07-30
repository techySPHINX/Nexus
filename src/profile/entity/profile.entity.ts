export class Skill {
  id: string;
  name: string;
  profileId?: string;
}

export class Profile {
  id: string;
  bio?: string;
  avatarUrl?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  skills: Skill[];
}
