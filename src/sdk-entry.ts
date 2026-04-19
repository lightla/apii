// src/sdk-entry.ts
import {createVueApp} from "@/bootstrap.ts";
import {envStorageManager, type EnvStorageProvider} from "@/storages/env-storage-manager";

class ApiiApp {
  private app: any
  private data: any = []
  private saveUrl: string = ''

  setJsonRequestsData(data: any) {
    this.data = data
  }

  setAPISaveRequests(url: string) {
    this.saveUrl = url
    // Also update env storage manager URL
    envStorageManager.setApiUrl(url)
  }

  setEnvStorageProvider(provider: EnvStorageProvider) {
    envStorageManager.setProvider(provider)
  }

  run(appId: string = '#apii-app1') {
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
export const newApp = () => new ApiiApp();
export const newLogger = () => new Logger();