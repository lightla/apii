  // main.ts
  import {createVueApp} from "@/bootstrap.ts";

  createVueApp({
    requestsData: [
      { group: 'User222', method: 'GET', route: '/resource/{{$activeStructureCode}}/board-role/role/get/roles/{{$widgetRoleId}}' },
      { group: 'User44', method: 'POST', route: '/users' },
      { group: 'Auth', method: 'POST', route: '/login' },
    ],
    saveUrl: '/dev-url',
    mountId: '#app',
  })
