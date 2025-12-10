import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async findActiveUsers(): Promise<User[]> {
    return this.find({ where: { isActive: true } });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.update(userId, { lastLogin: new Date() });
  }

  async searchUsers(search: string): Promise<User[]> {
    return this.createQueryBuilder('user')
      .where('user.name ILIKE :search', { search: `%${search}%` })
      .orWhere('user.email ILIKE :search', { search: `%${search}%` })
      .getMany();
  }
}