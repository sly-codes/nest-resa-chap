import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Le nom 'jwt-refresh' correspond à la RtStrategy
@Injectable()
export class RtGuard extends AuthGuard('jwt-refresh') {
}
