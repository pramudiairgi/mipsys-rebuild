import {
  Injectable,
  Inject,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { users } from '../database/schema';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>,
    private jwtService: JwtService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.username, dto.username),
    });

    if (!user) {
      throw new UnauthorizedException('Username atau password salah.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Username atau password salah.');
    }

    return this.generateTokens(user);
  }

  async refresh(dto: RefreshDto) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.refreshToken, dto.refreshToken),
    });

    if (!user) {
      throw new UnauthorizedException('Refresh token tidak valid.');
    }

    return this.generateTokens(user);
  }

  private async generateTokens(user: typeof users.$inferSelect) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      staffId: user.staffId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d' as any,
    });

    await this.db
      .update(users)
      .set({ refreshToken })
      .where(eq(users.id, user.id));

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        staffId: user.staffId,
      },
    };
  }
}
