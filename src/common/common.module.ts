import { Global, Module } from '@nestjs/common';

import { HealthController } from './health.controller';
import { PrismaModule } from './prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  exports: [PrismaModule],
})
export class CommonModule {}
