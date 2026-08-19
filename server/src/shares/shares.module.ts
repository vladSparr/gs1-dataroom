import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicSharesService } from './public-shares.service';
import { SharesController } from './shares.controller';
import { SharesService } from './shares.service';

@Module({
  controllers: [SharesController, PublicController],
  providers: [SharesService, PublicSharesService],
})
export class SharesModule {}
