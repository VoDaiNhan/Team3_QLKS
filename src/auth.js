// auth.js
let isRefreshing = false;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AuthDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('tokens')) {
        db.createObjectStore('tokens', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

export const getToken = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['tokens'], 'readonly');
    const store = transaction.objectStore('tokens');
    const request = store.get('auth');
    
    request.onsuccess = () => {
      resolve(request.result || { token: undefined, refreshToken: undefined });
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
};

const saveToken = async (token, refreshToken) => {
  console.log('Saving new tokens to IndexedDB:', { token, refreshToken });
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['tokens'], 'readwrite');
    const store = transaction.objectStore('tokens');
    const request = store.put({ id: 'auth', token, refreshToken });
    
    request.onsuccess = () => {
      console.log('Tokens saved successfully');
      resolve();
    };
    
    request.onerror = (event) => {
      console.error('Error saving tokens:', event.target.error);
      reject(event.target.error);
    };
  });
};

const clearTokens = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['tokens'], 'readwrite');
    const store = transaction.objectStore('tokens');
    const request = store.delete('auth');
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const refreshToken = async () => {
  if (isRefreshing) {
    throw new Error('Token refresh in progress');
  }

  isRefreshing = true;
  try {
    const currentTokens = await getToken();
    console.log('Attempting to refresh token with:', {
      token: currentTokens.token?.substring(0, 20) + '...',
      refreshToken: currentTokens.refreshToken?.substring(0, 20) + '...'
    });

    if (!currentTokens.token || !currentTokens.refreshToken) {
      throw new Error('No tokens found in storage');
    }

    const refreshResponse = await fetch('https://qlks-0dvh.onrender.com/api/auth/tokens/refresh', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Authorization': `Bearer ${currentTokens.token}`
      },
      credentials: 'include',
      body: JSON.stringify({ 
        token: currentTokens.token,
        refreshToken: currentTokens.refreshToken
      })
    });

    const responseText = await refreshResponse.text();
    console.log('Refresh token response:', responseText);

    if (!refreshResponse.ok) {
      throw new Error(responseText || 'Failed to refresh token');
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse refresh response:', error);
      throw new Error('Invalid refresh response format');
    }

    // Kiểm tra cấu trúc response
    if (!responseData.data || !responseData.data.token || !responseData.data.refreshToken) {
      console.error('Invalid response structure:', responseData);
      throw new Error('Invalid token data received');
    }

    const newTokens = {
      token: responseData.data.token,
      refreshToken: responseData.data.refreshToken
    };

    // Lưu token mới vào IndexedDB
    await saveToken(newTokens.token, newTokens.refreshToken);
    console.log('New tokens saved to IndexedDB:', {
      token: newTokens.token.substring(0, 20) + '...',
      refreshToken: newTokens.refreshToken.substring(0, 20) + '...'
    });

    return newTokens;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  } finally {
    isRefreshing = false;
  }
};

export const apiFetch = async (url, options = {}) => {
  let attempt = 0;
  const maxAttempts = 2;

  while (attempt < maxAttempts) {
    try {
      const tokens = await getToken();
      
      if (!tokens.token) {
        throw new Error('No authentication token found');
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.token}`,
        ...options.headers,
      };

      let response = await fetch(url, { ...options, headers });

      if (response.status === 401 && tokens.refreshToken) {
        console.log('Token expired, attempting refresh');
        const newTokens = await refreshToken();
        
        // Sử dụng token mới cho request
        headers.Authorization = `Bearer ${newTokens.token}`;
        response = await fetch(url, { ...options, headers });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error(`Request failed (attempt ${attempt + 1}/${maxAttempts}):`, error);
      if (attempt === maxAttempts - 1) throw error;
      attempt++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

export const saveAuthTokens = saveToken;
export const clearAuthTokens = clearTokens;

export async function loginAndSaveStaffId(email, password) {
  const res = await fetch('https://localhost:7274/api/Auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, matKhau: password })
  });

  if (!res.ok) {
    throw new Error('Login failed');
  }

  const data = await res.json();
  
  // Save tokens to IndexedDB immediately after login
  await saveToken(data.token, data.refreshToken);
  console.log('Initial tokens saved after login');

  if (data.idNhanVien) {
    localStorage.setItem('nhanVienId', data.idNhanVien);
  }
  
  return data;
}

// Login with existing token
export async function loginWithToken(token, refreshToken, userInfo) {
  await saveToken(token, refreshToken);
  if (userInfo?.idNhanVien) {
    localStorage.setItem('nhanVienId', userInfo.idNhanVien);
  }
  if (userInfo?.hoTen) {
    localStorage.setItem('user', JSON.stringify(userInfo));
  }
}