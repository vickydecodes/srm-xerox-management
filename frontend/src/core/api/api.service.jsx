import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isLoggingOut = false;

export const setupInterceptors = (onUnauthorized) => {
  api.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error.response?.status === 401) {
        if (!isLoggingOut) {
          isLoggingOut = true;
          const message =
            error.response?.data?.message ||
            error.response?.data?.error ||
            'Session expired. Please login again.';
          onUnauthorized?.(message);
        }
      }
      return Promise.reject(error);
    }
  );
};

export const getRequest = async (url, params = {}, headers = {}) => {
  const response = await api.get(url, { params, headers });
  return response.data;
};

export const postRequest = async (url, data = {}, headers = {}) => {
  const response = await api.post(url, data, { headers });
  return response.data;
};

export const putRequest = async (url, data = {}, headers = {}) => {
  const response = await api.put(url, data, { headers });
  return response.data;
};

export const patchRequest = async (url, data = {}, headers = {}) => {
  const response = await api.patch(url, data, { headers });
  return response.data;
};

export const deleteRequest = async (url, params = {}, headers = {}) => {
  const response = await api.delete(url, { params, headers });
  return response.data;
};

export const downloadFile = async (url, params) => {
  let filename = 'download';
  const response = await api.get(url, {
    responseType: 'blob',
    params: {...params, _t: Date.now()}, 
    validateStatus: null,
  });

  if (response.status >= 400) {
    const text = await response.data.text();
    let message = 'Export failed';
    try {
      const json = JSON.parse(text);
      message = json.message || json.error || message;
    } catch {  }
    
    const err = new Error(message);
    err.response = { status: response.status, data: { message } };
    throw err;
  }

  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename="(.+)"/);
  if (match) filename = match[1];

  const blobUrl = window.URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);

  return filename;
};

export const printPdf = async (url, params = {}) => {
  const response = await api.get(url, {
    responseType: 'blob',
    params: { ...params, _t: Date.now() },
    validateStatus: null,
  });

  if (response.status >= 400) {
    const text = await response.data.text();
    let message = 'Fetch PDF failed';
    try {
      const json = JSON.parse(text);
      message = json.message || json.error || message;
    } catch { }

    const err = new Error(message);
    err.response = { status: response.status, data: { message } };
    throw err;
  }

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const blobUrl = window.URL.createObjectURL(blob);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '100vw';
  iframe.style.height = '100vh';
  iframe.style.opacity = '0';
  iframe.style.border = '0';
  iframe.style.pointerEvents = 'none';
  iframe.src = blobUrl;

  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      iframe.remove();
      window.URL.revokeObjectURL(blobUrl);
    }, 60000);
  };

  document.body.appendChild(iframe);
};

export const downloadDocx = async (url, filename = 'document.docx', config = {}) => {
  const response = await api.get(url, {
    responseType: 'blob',
    ...config,
  });

  if (response.status >= 400 || !response.data) {
    let message = 'Failed to download document';
    try {
      const text = await response.data.text();
      const json = JSON.parse(text);
      message = json.message || json.error || message;
    } catch {}

    const err = new Error(message);
    err.response = { status: response.status, data: { message } };
    throw err;
  }

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
};

export const printDocx = async (url, config = {}) => {
  const response = await api.get(url, {
    responseType: 'blob',
    ...config,
  });

  if (response.status >= 400 || !response.data) {
    let message = 'Failed to fetch document';
    try {
      const text = await response.data.text();
      const json = JSON.parse(text);
      message = json.message || json.error || message;
    } catch {}

    const err = new Error(message);
    err.response = { status: response.status, data: { message } };
    throw err;
  }

  const { renderAsync } = await import('docx-preview');

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '100vw';
  iframe.style.height = '100vh';
  iframe.style.opacity = '0';
  iframe.style.border = '0';
  iframe.style.pointerEvents = 'none';

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    throw new Error('Unable to create print frame');
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Bill</title>
        <style>
          @page {
            margin: 10mm;
            size: auto;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #1e293b;
            font-family: Calibri, 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .docx-wrapper {
            background: transparent !important;
            padding: 0 !important;
          }
          .docx-wrapper > section.docx {
            box-shadow: none !important;
            margin: 0 auto !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: auto !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
        </style>
      </head>
      <body>
        <div id="docx-container"></div>
      </body>
    </html>
  `);
  doc.close();

  const container = doc.getElementById('docx-container');
  if (container) {
    await renderAsync(response.data, container, null, {
      inWrapper: false,
      ignoreWidth: false,
      ignoreHeight: false,
      breakPages: true,
    });
  }

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      iframe.remove();
    }, 60000);
  }, 250);
};

export default api;



