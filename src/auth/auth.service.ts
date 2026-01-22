import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { isEmail } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerAuthDto: RegisterAuthDto) {
    const { email, password, name, phone, username } = registerAuthDto;

    if (!email || !password || !name || !phone || !username) {
      throw new HttpException(
        'All fields are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!isEmail(email)) {
      throw new HttpException('Invalid email', HttpStatus.BAD_REQUEST);
    }

    if (password.length < 6) {
      throw new HttpException('Password must be at least 6 characters long', HttpStatus.BAD_REQUEST);
    }

    if (name.length < 3) {
      throw new HttpException('Name must be at least 3 characters long', HttpStatus.BAD_REQUEST);
    }

    if (username.length < 3) {
      throw new HttpException('Username must be at least 3 characters long', HttpStatus.BAD_REQUEST);
    }

    const existingUserByEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingUserByEmail) {
      throw new HttpException('User with this email already exists', HttpStatus.BAD_REQUEST);
    }

    const existingUserByUsername = await this.prisma.user.findUnique({ where: { username } });
    if (existingUserByUsername) {
      throw new HttpException('Username is already taken', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        username,
      },
    });

    const { password: userPassword, ...userWithoutPassword } = newUser;
    
    const token = await this.generateToken(newUser.id, newUser.email, newUser.username);

    return {
      user: userWithoutPassword,
      access_token: token,
    };
  }

  async login(loginAuthDto: LoginAuthDto) {
    const { email, password } = loginAuthDto;

    if (!email || !password) {
      throw new HttpException(
        'Email and password are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const { password: userPassword, ...userWithoutPassword } = user;
    
    const token = await this.generateToken(user.id, user.email, user.username);

    return {
      user: userWithoutPassword,
      access_token: token,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  private async generateToken(userId: string, email: string, username: string): Promise<string> {
    const payload = {
      sub: userId,
      email,
      username,
    };

    return this.jwtService.sign(payload);
  }
}

