const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const ExcelJS = require('exceljs');
const docx = require('docx');
const officeParser = require('officeparser');

let mainWindow;
let wsClient = null;
let currentConfig = { token: '', folderPath: '' };
const configPath = path.join(app.getPath('userData'), 'wappy_config.json');

// Load config from file
if (fs.existsSync(configPath)) {
  try {
    currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.error('Error loading config file:', e);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 650,
    resizable: false,
    autoHideMenuBar: true,
    title: 'Somos SST - WappyClub',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Config Handlers
ipcMain.handle('get-config', () => currentConfig);
ipcMain.on('save-config', (event, config) => {
  currentConfig = { ...currentConfig, ...config };
  fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), 'utf8');
});

// Folder Picker IPC
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// Log forwarding to GUI console helper
function sendLog(message) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('log-message', message);
  }
}

// WebSocket Connection Manager
ipcMain.on('connect-websocket', (event, { token, folderPath }) => {
  if (wsClient) {
    wsClient.close();
  }

  // Pre-configured WAPPY production WebSocket URL
  const serverUrl = 'wss://ia.wappy.club/ws/mcp';
  sendLog(`🔌 Conectando con ${serverUrl}...`);

  try {
    wsClient = new WebSocket(serverUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    wsClient.on('open', () => {
      sendLog('🟢 Conexión WebSocket establecida con el servidor WAPPY.');
      mainWindow.webContents.send('status-change', 'connected');
    });

    wsClient.on('message', async (data) => {
      let rawMsg = data.toString();
      try {
        let rpcRequest = JSON.parse(rawMsg);
        sendLog(`📥 Solicitud del agente recibida: ${rpcRequest.method}`);
        
        // Handle JSON-RPC request from WAPPY
        let response = await handleMcpRequest(rpcRequest, folderPath);
        if (wsClient && wsClient.readyState === WebSocket.OPEN) {
          wsClient.send(JSON.stringify(response));
        }
      } catch (err) {
        sendLog(`❌ Error de procesamiento: ${err.message}`);
      }
    });

    wsClient.on('close', () => {
      sendLog('🔴 Conexión cerrada con el servidor WAPPY.');
      mainWindow.webContents.send('status-change', 'disconnected');
      wsClient = null;
    });

    wsClient.on('error', (err) => {
      sendLog(`⚠️ Error de conexión: ${err.message}`);
      mainWindow.webContents.send('status-change', 'disconnected');
      wsClient = null;
    });

  } catch (err) {
    sendLog(`❌ Excepción al conectar: ${err.message}`);
  }
});

// Disconnect IPC
ipcMain.on('disconnect-websocket', () => {
  if (wsClient) {
    sendLog('🔌 Desconectando de forma manual...');
    wsClient.close();
  }
});

// --- CUSTOM MCP SERVER ENGINE WITH DOCX AND EXCEL CAPABILITIES ---
async function handleMcpRequest(rpc, sharedFolder) {
  const { method, params, id } = rpc;

  // 1. Tool Listing Handlers
  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id: id,
      result: {
        tools: [
          {
            name: 'list_directory',
            description: 'Lista el contenido de la carpeta compartida en tu computadora local.',
            inputSchema: { type: 'object', properties: {} }
          },
          {
            name: 'read_file',
            description: 'Lee el contenido de un archivo de texto dentro de la carpeta compartida.',
            inputSchema: {
              type: 'object',
              properties: {
                relative_path: { type: 'string', description: 'Ruta relativa del archivo a leer.' }
              },
              required: ['relative_path']
            }
          },
          {
            name: 'write_file',
            description: 'Crea o sobrescribe un archivo con el texto especificado dentro de la carpeta.',
            inputSchema: {
              type: 'object',
              properties: {
                relative_path: { type: 'string', description: 'Ruta del archivo a guardar.' },
                content: { type: 'string', description: 'Contenido en formato texto plano.' }
              },
              required: ['relative_path', 'content']
            }
          },
          {
            name: 'read_excel_file',
            description: 'Lee y procesa un archivo de Excel (.xlsx) estructurando las hojas, celdas y filas en formato JSON.',
            inputSchema: {
              type: 'object',
              properties: {
                relative_path: { type: 'string', description: 'Nombre o ruta relativa del archivo Excel.' }
              },
              required: ['relative_path']
            }
          },
          {
            name: 'write_excel_file',
            description: 'Crea o sobrescribe un archivo Excel (.xlsx) a partir de un arreglo de objetos JSON (tablas y filas).',
            inputSchema: {
              type: 'object',
              properties: {
                relative_path: { type: 'string', description: 'Ruta para el nuevo archivo Excel.' },
                sheets: {
                  type: 'array',
                  description: 'Arreglo de hojas de Excel a crear.',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: 'Nombre de la hoja de cálculo.' },
                      rows: {
                        type: 'array',
                        description: 'Filas de la hoja de cálculo. Cada fila es un arreglo de valores celdas.',
                        items: { type: 'array', items: { type: 'string' } }
                      }
                    },
                    required: ['name', 'rows']
                  }
                }
              },
              required: ['relative_path', 'sheets']
            }
          },
          {
            name: 'read_docx_file',
            description: 'Lee y extrae todo el texto de un documento de Word (.docx) local.',
            inputSchema: {
              type: 'object',
              properties: {
                relative_path: { type: 'string', description: 'Ruta relativa del documento .docx.' }
              },
              required: ['relative_path']
            }
          },
          {
            name: 'write_docx_file',
            description: 'Genera un documento de Word (.docx) con párrafos de texto y títulos estructurados.',
            inputSchema: {
              type: 'object',
              properties: {
                relative_path: { type: 'string', description: 'Ruta para el nuevo archivo Word.' },
                paragraphs: {
                  type: 'array',
                  description: 'Párrafos del documento. Cada elemento es un objeto con tipo ("heading1", "heading2", "text") y el texto.',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['heading1', 'heading2', 'text'] },
                      text: { type: 'string' }
                    },
                    required: ['type', 'text']
                  }
                }
              },
              required: ['relative_path', 'paragraphs']
            }
          }
        ]
      }
    };
  }

  // 2. Tool Execution Handlers
  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    const targetPath = args && args.relative_path ? path.resolve(sharedFolder, args.relative_path) : '';
    
    // Strict Directory Sandbox Security Verification
    if (targetPath && !targetPath.startsWith(sharedFolder)) {
      return {
        jsonrpc: '2.0',
        id: id,
        error: { code: -32602, message: 'Seguridad: Acceso fuera de la carpeta compartida denegado.' }
      };
    }

    try {
      if (name === 'list_directory') {
        const files = fs.readdirSync(sharedFolder);
        const fileDetails = files.map(file => {
          const stats = fs.statSync(path.join(sharedFolder, file));
          return {
            name: file,
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.size
          };
        });
        return createRpcResponse(id, { content: [{ type: 'text', text: JSON.stringify(fileDetails, null, 2) }] });
      }

      if (name === 'read_file') {
        const textContent = fs.readFileSync(targetPath, 'utf8');
        return createRpcResponse(id, { content: [{ type: 'text', text: textContent }] });
      }

      if (name === 'write_file') {
        fs.writeFileSync(targetPath, args.content, 'utf8');
        return createRpcResponse(id, { content: [{ type: 'text', text: `Archivo guardado exitosamente en: ${args.relative_path}` }] });
      }

      // --- EXCEL READ/WRITE TOOL ENGINE ---
      if (name === 'read_excel_file') {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(targetPath);
        const result = {};
        
        workbook.eachSheet((sheet) => {
          const sheetRows = [];
          sheet.eachRow({ includeEmpty: false }, (row) => {
            // Convert Excel cells to array values
            sheetRows.push(row.values.slice(1)); // cell index starts at 1
          });
          result[sheet.name] = sheetRows;
        });
        
        return createRpcResponse(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
      }

      if (name === 'write_excel_file') {
        const workbook = new ExcelJS.Workbook();
        
        args.sheets.forEach(sheetData => {
          const worksheet = workbook.addWorksheet(sheetData.name);
          sheetData.rows.forEach(rowData => {
            worksheet.addRow(rowData);
          });
        });

        await workbook.xlsx.writeFile(targetPath);
        return createRpcResponse(id, { content: [{ type: 'text', text: `Documento Excel escrito con éxito en: ${args.relative_path}` }] });
      }

      // --- WORD DOCX READ/WRITE TOOL ENGINE ---
      if (name === 'read_docx_file') {
        return new Promise((resolve) => {
          officeParser.parseOffice(targetPath, (data, err) => {
            if (err) {
              resolve({
                jsonrpc: '2.0',
                id: id,
                error: { code: -32603, message: `Error al leer Word: ${err}` }
              });
            } else {
              resolve(createRpcResponse(id, { content: [{ type: 'text', text: data }] }));
            }
          });
        });
      }

      if (name === 'write_docx_file') {
        const docObj = new docx.Document({
          sections: [{
            properties: {},
            children: args.paragraphs.map(p => {
              let headingStyle = docx.HeadingLevel.HEADING_1;
              if (p.type === 'heading2') headingStyle = docx.HeadingLevel.HEADING_2;
              
              if (p.type.startsWith('heading')) {
                return new docx.Paragraph({
                  text: p.text,
                  heading: headingStyle,
                  spacing: { after: 200 }
                });
              } else {
                return new docx.Paragraph({
                  text: p.text,
                  spacing: { after: 120 }
                });
              }
            })
          }]
        });

        const buffer = await docx.Packer.toBuffer(docObj);
        fs.writeFileSync(targetPath, buffer);
        return createRpcResponse(id, { content: [{ type: 'text', text: `Documento Word creado con éxito en: ${args.relative_path}` }] });
      }

      // Default fallback
      return {
        jsonrpc: '2.0',
        id: id,
        error: { code: -32601, message: `Herramienta ${name} no soportada.` }
      };

    } catch (err) {
      sendLog(`❌ Error en herramienta ${name}: ${err.message}`);
      return {
        jsonrpc: '2.0',
        id: id,
        error: { code: -32603, message: `Error local del sistema: ${err.message}` }
      };
    }
  }

  // Not handled
  return {
    jsonrpc: '2.0',
    id: id,
    error: { code: -32601, message: 'Operación no implementada en el Agente Local.' }
  };
}

function createRpcResponse(id, result) {
  return {
    jsonrpc: '2.0',
    id: id,
    result: result
  };
}
