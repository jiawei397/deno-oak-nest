export class AsyncFactory {
  static connected = false;
  static register(db: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connected = true;
        resolve(db);
      }, 10);
    });
  }
}
