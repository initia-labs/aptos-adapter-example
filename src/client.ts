import { LCDClient } from '@initia/initia.js';

class InitiaConfig {
  client: LCDClient;

  constructor(url: string) {
    this.client = new LCDClient(url);
  }
}

export { InitiaConfig };