import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Le nom 'jwt' correspond à l'AtStrategy
@Injectable()
export class AtGuard extends AuthGuard('jwt') {
}
