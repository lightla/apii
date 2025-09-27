  // main.ts
  import {createVueApp} from "@/bootstrap.ts";
  import {nanoid} from "nanoid";

  createVueApp({
    requestsData: [
      { id: nanoid(), group: 'User22212ff', method: 'GET', route: '{domain}/resource/{$activeStructureCode}/board-role/role/get/roles/{{$widgetRoleId}}' },
      { id: nanoid(), group: 'User44', method: 'POST', route: '{domain}/users' },
      { id: nanoid(), group: 'Auth', method: 'POST', route: '{domain}/login' },
    ],
    saveUrl: '/dev-url',
    mountId: '#app',
  })
