// src/sdk-entry.ts
import {createVueApp} from "@/bootstrap.ts";

export default class Apii {
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