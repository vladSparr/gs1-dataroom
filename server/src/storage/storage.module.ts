import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';

// Global: folder and room deletion need it to clear blobs, and neither of
// those modules should have to know where storage lives.
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
