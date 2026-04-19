  // main.ts
  import {createVueApp} from "@/bootstrap.ts";
  import {nanoid} from "nanoid";

  createVueApp({
    requestsData: [
      { id: nanoid(), group: 'User22212ff', method: 'GET', route: '{domain}/resource/{$activeStructureCode}/board-role/role/get/roles/{{$widgetRoleId}}' },
      { id: nanoid(), group: 'User44', method: 'POST', route: '{domain}/users' },
      { id: nanoid(), group: 'Auth', method: 'POST', route: '{domain}/login' },
      { id: nanoid(), group: 'Sample', method: 'GET', route: 'https://api.sampleapis.com/codingresources/codingResources' },
      { id: nanoid(), group: 'Sample', method: 'POST', route: 'https://api.restful-api.dev/objects' },
      { id: nanoid(), group: 'Sample', method: 'POST', route: 'https://api.escuelajs.co/api/v1/files/upload' },
    ],
    saveUrl: '/dev-url',
    mountId: '#app',
  })
