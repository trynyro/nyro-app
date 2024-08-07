const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      const validChannels = ['windowDrag', 'toggle-retract', 'reset-position','toggle-pin', 'updateMessage'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    on: (channel, func) => {
      const validChannels = ['insert-selected-image', 'insert-selected-text', 'retraction-state-changed', 'retraction-progress', 'retraction-complete', 'resize', 'updateMessage'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    removeListener: (channel, func) => {
      const validChannels = ['insert-selected-image', 'insert-selected-text', 'retraction-state-changed', 'retraction-progress', 'retraction-complete', 'resize', 'updateMessage'];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, func);
      }
    },
    invoke: (channel, ...args) => {
      const validChannels = ['toggle-retract', 'retract-window', 'expand-window', 'reset-position'];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      return Promise.reject(new Error(`Invoke to '${channel}' is not allowed`));
    }
  }
});