import { User, UserRole, AccountStatus } from '@prisma/client';

export interface UserResponseDto {
  id: string;
  name: string | null;
  username: string;
  email: string;
  avatarUrl: string | null;
  githubId: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  accessToken: string;
  expiresIn: number;
}

export interface SessionResponseDto {
  user: UserResponseDto;
  isAuthenticated: boolean;
}

export const mapUserToResponseDto = (user: User): UserResponseDto => {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    githubId: user.githubId,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };
};
