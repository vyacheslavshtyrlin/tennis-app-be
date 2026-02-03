import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WorkerIpGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const allowed = (this.configService.get<string>('ALLOW_WORKER_IP') || '')
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean);

    if (!allowed.length) {
      return true;
    }

    const forwarded = (request.headers['x-forwarded-for'] as string) || '';
    const clientIp =
      forwarded.split(',')[0]?.trim() ||
      request.ip ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      '';

    const normalized = this.normalizeIp(clientIp);
    const isAllowed = allowed.some((ip) => this.normalizeIp(ip) === normalized);

    if (!isAllowed) {
      throw new ForbiddenException('Worker IP not allowed');
    }

    return true;
  }

  private normalizeIp(ip: string) {
    return ip.replace('::ffff:', '').trim();
  }
}
