  // main.ts
  import {createVueApp} from "@/bootstrap.ts";

  createVueApp({
    requestsData: [
      { group: 'User22212ff', method: 'GET', route: '{domain}/resource/{$activeStructureCode}/board-role/role/get/roles/{{$widgetRoleId}}' },
      { group: 'User44', method: 'POST', route: '{domain}/users' },
      { group: 'Auth', method: 'POST', route: '{domain}/login' },
    ],
    saveUrl: '/dev-url',
    mountId: '#app',
  })
