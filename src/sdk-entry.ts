// src/sdk-entry.ts
import {createVueApp} from "@/bootstrap.ts";

class ApiiApp {
  private app: any
  private data: any = []
  private saveUrl: string = ''

  setJsonRequestsData(data: any) {
    this.data = data
  }

  setAPISaveRequests(url: string) {
    this.saveUrl = url
  }

  run(appId: string = '#apii-app') {
    this.app = createVueApp({
      requestsData: this.data,
      saveUrl: this.saveUrl,
      mountId: appId,
    })
  }
}

class Logger {
  log(msg: string) {
    console.log("[Logger]:", msg);
  }
}

// expose namespace
const Apii = {
  newApp: () => new ApiiApp(),
  newLogger: () => new Logger(),
};

export default Apii;