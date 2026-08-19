import { Global, Module } from '@nestjs/common';
import { AccessService } from './access.service';

// Global: every feature module reads through this gate, and none of them
// should be able to skip it by simply not importing the module.
@Global()
@Module({
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
