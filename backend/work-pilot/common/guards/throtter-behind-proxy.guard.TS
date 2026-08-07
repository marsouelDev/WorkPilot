import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected getTracker(req: Request): Promise<string> {
    return Promise.resolve(
      req.ips.length > 0 ? (req.ips[0] ?? 'unknown') : (req.ip ?? 'unknown'),
    );
  }
}
