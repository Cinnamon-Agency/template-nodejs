export class ServerState {
    private isShuttingDown: boolean = false
  
    public set shuttingDown(value: boolean) {
      this.isShuttingDown = value
    }
  
    public get shuttingDown(): boolean {
      return this.isShuttingDown
    }
  }
  
  export const serverState = new ServerState() 