const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  db: {
    query: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
    run: (sql, params) => ipcRenderer.invoke('db:run', sql, params),
  },
  jobs: {
    getAll: (filters) => ipcRenderer.invoke('jobs:getAll', filters),
    getById: (id) => ipcRenderer.invoke('jobs:getById', id),
    create: (data) => ipcRenderer.invoke('jobs:create', data),
    update: (id, data) => ipcRenderer.invoke('jobs:update', id, data),
    delete: (id) => ipcRenderer.invoke('jobs:delete', id),
  },
  notes: {
    getByJob: (jobId) => ipcRenderer.invoke('notes:getByJob', jobId),
    add: (jobId, data) => ipcRenderer.invoke('notes:add', jobId, data),
  },
  milestones: {
    toggle: (id) => ipcRenderer.invoke('milestones:toggle', id),
  },
  lateParts: {
    getByJob: (jobId) => ipcRenderer.invoke('lateParts:getByJob', jobId),
    add: (jobId, data) => ipcRenderer.invoke('lateParts:add', jobId, data),
  },
  risks: {
    getByJob: (jobId) => ipcRenderer.invoke('risks:getByJob', jobId),
    add: (jobId, data) => ipcRenderer.invoke('risks:add', jobId, data),
  },
  admin: {
    getStatuses: () => ipcRenderer.invoke('admin:getStatuses'),
    getMachineTypes: () => ipcRenderer.invoke('admin:getMachineTypes'),
    getTemplates: () => ipcRenderer.invoke('admin:getTemplates'),
    addMachineType: (data) => ipcRenderer.invoke('admin:addMachineType', data),
    addStatus: (data) => ipcRenderer.invoke('admin:addStatus', data),
    addTemplate: (data) => ipcRenderer.invoke('admin:addTemplate', data),
    deleteMachineType: (id) => ipcRenderer.invoke('admin:deleteMachineType', id),
    deleteStatus: (id) => ipcRenderer.invoke('admin:deleteStatus', id),
    deleteTemplate: (id) => ipcRenderer.invoke('admin:deleteTemplate', id),
  },
  navigate: (page, params) => ipcRenderer.invoke('navigate', page, params),
  onNavigate: (cb) => ipcRenderer.on('navigate', (e, page, params) => cb(page, params)),
});
