  // main.ts
  import {createVueApp} from "@/bootstrap.ts";
  import {nanoid} from "nanoid";

  const seedRequest = (id: string, data: unknown) => {
    const key = `api_request_data_${id}`
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(data))
    }
  }

  // Seed full examples for https://api.restful-api.dev (method/url/body/params...)
  const restfulGetAllObjectsId = nanoid()
  const restfulGetObjectByIdId = nanoid()
  const restfulGetObject7Id = nanoid()
  const restfulPostCreateObjectId = nanoid()
  const restfulPutUpdateObjectId = nanoid()
  const restfulPatchPartialUpdateObjectId = nanoid()
  const restfulDeleteObjectId = nanoid()

  seedRequest(restfulGetAllObjectsId, {
    baseUrl: 'https://api.restful-api.dev/objects',
    method: 'GET',
    headers: [],
    queryParams: [],
    uriParameters: [],
    bodyType: 'none',
    body: '',
    formData: [],
    selectedHeaderPresetIds: [],
    selectedQueryPresetIds: [],
    selectedBodyPresetIds: [],
  })

  seedRequest(restfulGetObjectByIdId, {
    baseUrl: 'https://api.restful-api.dev/objects/{id}',
    method: 'GET',
    headers: [],
    queryParams: [],
    uriParameters: [{ key: 'id', value: '7' }],
    bodyType: 'none',
    body: '',
    formData: [],
    selectedHeaderPresetIds: [],
    selectedQueryPresetIds: [],
    selectedBodyPresetIds: [],
  })

  seedRequest(restfulGetObject7Id, {
    baseUrl: 'https://api.restful-api.dev/objects/7',
    method: 'GET',
    headers: [],
    queryParams: [],
    uriParameters: [],
    bodyType: 'none',
    body: '',
    formData: [],
    selectedHeaderPresetIds: [],
    selectedQueryPresetIds: [],
    selectedBodyPresetIds: [],
  })

  seedRequest(restfulPostCreateObjectId, {
    baseUrl: 'https://api.restful-api.dev/objects',
    method: 'POST',
    headers: [],
    queryParams: [],
    uriParameters: [],
    bodyType: 'json',
    body: JSON.stringify(
      {
        name: 'Apple MacBook Pro 16',
        data: {
          year: 2019,
          price: 1849.99,
          'CPU model': 'Intel Core i9',
          'Hard disk size': '1 TB',
        },
      },
      null,
      2,
    ),
    formData: [],
    selectedHeaderPresetIds: [],
    selectedQueryPresetIds: [],
    selectedBodyPresetIds: [],
  })

  seedRequest(restfulPutUpdateObjectId, {
    baseUrl: 'https://api.restful-api.dev/objects/{id}',
    method: 'PUT',
    headers: [],
    queryParams: [],
    uriParameters: [{ key: 'id', value: 'ff808181932badb6019336f28b8305cb' }],
    bodyType: 'json',
    body: JSON.stringify(
      {
        name: 'Apple MacBook Pro 16 (Updated)',
        data: {
          year: 2019,
          price: 2049.99,
          'CPU model': 'Intel Core i9',
          'Hard disk size': '1 TB',
        },
      },
      null,
      2,
    ),
    formData: [],
    selectedHeaderPresetIds: [],
    selectedQueryPresetIds: [],
    selectedBodyPresetIds: [],
  })

  seedRequest(restfulPatchPartialUpdateObjectId, {
    baseUrl: 'https://api.restful-api.dev/objects/{id}',
    method: 'PATCH',
    headers: [],
    queryParams: [],
    uriParameters: [{ key: 'id', value: 'ff808181932badb6019336f28b8305cb' }],
    bodyType: 'json',
    body: JSON.stringify(
      {
        data: {
          price: 1999.99,
        },
      },
      null,
      2,
    ),
    formData: [],
    selectedHeaderPresetIds: [],
    selectedQueryPresetIds: [],
    selectedBodyPresetIds: [],
  })

  seedRequest(restfulDeleteObjectId, {
    baseUrl: 'https://api.restful-api.dev/objects/{id}',
    method: 'DELETE',
    headers: [],
    queryParams: [],
    uriParameters: [{ key: 'id', value: 'ff808181932badb6019336f28b8305cb' }],
    bodyType: 'none',
    body: '',
    formData: [],
    selectedHeaderPresetIds: [],
    selectedQueryPresetIds: [],
    selectedBodyPresetIds: [],
  })

  createVueApp({
    requestsData: [
      { id: nanoid(), group: 'User22212ff', method: 'GET', route: '{domain}/resource/{$activeStructureCode}/board-role/role/get/roles/{{$widgetRoleId}}', tags: [] },
      { id: nanoid(), group: 'User44', method: 'POST', route: '{domain}/users', tags: [] },
      { id: nanoid(), group: 'Auth', method: 'POST', route: '{domain}/login', tags: [] },
      { id: nanoid(), group: 'Sample', method: 'GET', route: 'https://api.sampleapis.com/codingresources/codingResources', tags: [] },
      { id: restfulGetAllObjectsId, group: 'RESTful API', method: 'GET', route: 'https://api.restful-api.dev/objects', tags: [] },
      { id: restfulGetObjectByIdId, group: 'RESTful API', method: 'GET', route: 'https://api.restful-api.dev/objects/{id}', tags: [] },
      { id: restfulGetObject7Id, group: 'RESTful API', method: 'GET', route: 'https://api.restful-api.dev/objects/7', tags: [] },
      { id: restfulPostCreateObjectId, group: 'RESTful API', method: 'POST', route: 'https://api.restful-api.dev/objects', tags: [] },
      { id: restfulPutUpdateObjectId, group: 'RESTful API', method: 'PUT', route: 'https://api.restful-api.dev/objects/{id}', tags: [] },
      { id: restfulPatchPartialUpdateObjectId, group: 'RESTful API', method: 'PATCH', route: 'https://api.restful-api.dev/objects/{id}', tags: [] },
      { id: restfulDeleteObjectId, group: 'RESTful API', method: 'DELETE', route: 'https://api.restful-api.dev/objects/{id}', tags: [] },
      { id: nanoid(), group: 'Sample', method: 'POST', route: 'https://api.escuelajs.co/api/v1/files/upload', tags: [] },
    ],
    saveUrl: '/dev-url',
    mountId: '#app',
  })
