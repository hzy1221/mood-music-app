async function getSpotifyAccessToken() {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: 'grant_type=client_credentials'
  });

  const data = await res.json();
  return data.access_token;
}

async function analyzeMood(userInput) {
  try {
    const apiKey = import.meta.env.VITE_X_API_KEY;
    
    console.log("開始發送請求到 X.AI API");
    
    // 直接使用完整 URL，不依賴代理
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // 嘗試使用官方文檔中提到的模型名稱
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: '你是一個情緒分析助手。請輸出一個單詞情緒，例如：開心、憤怒、悲傷，不要加解釋。'
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        temperature: 0.3,
        max_tokens: 10
      }),
    });
    
    console.log("API 回應狀態:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API 錯誤詳情:", errorText);
      throw new Error(`X API 回應錯誤 (${response.status}): ${errorText}`);
    }
    
    const responseText = await response.text();
    console.log("API 原始回應:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("JSON 解析錯誤:", e);
      throw new Error("無法解析 API 回應");
    }
    
    console.log("解析後的 API 回應:", data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("回應格式不符合預期:", data);
      throw new Error("API 回應格式不符合預期");
    }
    
    const moodResponse = data.choices[0].message.content.trim();
    console.log("分析出的情緒:", moodResponse);
    
    return moodResponse;
  } catch (error) {
    console.error("分析情緒時發生錯誤:", error);
    throw error;
  }
}

async function searchSpotify(mood) {
  try {
    const token = await getSpotifyAccessToken();
    
    // 獲取多首歌曲 (將 limit 增加到 10-20)
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(mood)}&type=track&limit=10`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error("Spotify API 回應狀態:", response.status);
      const errorText = await response.text();
      console.error("Spotify API 錯誤詳情:", errorText);
      throw new Error('Spotify API 回應錯誤');
    }

    const data = await response.json();
    if (data.tracks && data.tracks.items.length > 0) {
      // 從結果中隨機選擇一首歌
      const randomIndex = Math.floor(Math.random() * data.tracks.items.length);
      const track = data.tracks.items[randomIndex];
      
      return {
        name: track.name,
        artist: track.artists[0].name,
        url: track.external_urls.spotify
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("搜尋 Spotify 錯誤:", error);
    throw error;
  }
}

async function getRecommendation() {
  const userInput = document.getElementById('moodInput').value;
  const resultDiv = document.getElementById('result');

  if (!userInput.trim()) {
    resultDiv.innerHTML = '<p>請先輸入心情描述喔！😊</p>';
    return;
  }

  resultDiv.innerHTML = '<p>正在分析你的心情中...</p>';

  try {
    const mood = await analyzeMood(userInput);
    resultDiv.innerHTML = `<p>判斷到的情緒是：<strong>${mood}</strong> 🎯<br>正在為你搜尋音樂中...</p>`;
    const song = await searchSpotify(mood);
    if (song) {
      resultDiv.innerHTML += `
        <p>為你推薦的歌曲：</p>
        <p><strong>${song.name}</strong> - ${song.artist}</p>
        <p><a href="${song.url}" target="_blank">🎵 點我聽音樂</a></p>`;
    } else {
      resultDiv.innerHTML += `<p>找不到符合的歌曲 😢</p>`;
    }
  } catch (error) {
    console.error(error);
    resultDiv.innerHTML = '<p>發生錯誤啦！請檢查 API 金鑰是否正確 🧩</p>';
  }
}

window.getRecommendation = getRecommendation;
