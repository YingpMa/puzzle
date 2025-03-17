# 🎯 Puzzle Leaderboard API  

A lightweight API for tracking player scores in a puzzle game. Built with **Node.js**, **Express**, **MongoDB**, and **Redis** for speed and efficiency.  

## 🚀 Features  
- **JWT-based authentication** – Secure login with access tokens.  
- **Single score per player** – Submitting a new score replaces the old one.  
- **Rate limiting** – Prevents spam (10 requests per minute).  
- **Redis caching** – Faster leaderboard queries (cached for up to 5 minutes).  

## 🔧 Setup & Installation  

1. **Install dependencies**  
   ```bash
   npm install
   ```  

2. **Set up MongoDB & Redis**  
   - **MongoDB** – Add your connection string to `config.json`.  
   - **Redis** – Run `redis-server` locally or use a hosted Redis service.  

3. **Create a `.env` file** for JWT authentication:  
   ```bash
   ACCESS_TOKEN_SECRET=your-secret-key
   ```  

4. **Start the server**  
   ```bash
   npm start
   ```  
   The API will be available at [http://localhost:8000](http://localhost:8000).  

## 📌 API Endpoints  

### 🔹 **User Management**  
1. **Create an account** – `POST /create-account`  
   - **Body:** `{ playerName, email, password }`  
   - **Returns:** Access token for authentication.  

2. **Log in** – `POST /login`  
   - **Body:** `{ email, password }`  
   - **Returns:** Access token.  

### 🔹 **Leaderboard**  
3. **Submit a score** – `POST /add-score` *(Requires authentication)*  
   - **Headers:** `Authorization: Bearer <token>`  
   - **Body:** `{ score }`  
   - **Note:** Updates the player's existing score if it's higher.  

4. **Get top scores** – `GET /top-scores`  
   - **Returns:** Cached leaderboard (may be up to 5 minutes old).  

5. **Check player rank** – `GET /player-rank` *(Requires authentication)*  
   - **Headers:** `Authorization: Bearer <token>`  
   - **Returns:** Player's rank based on their score.  

## 📝 Additional Notes  
- **Caching:** `/top-scores` results might be slightly outdated due to Redis caching.  
- **Rate limiting:** Each IP is limited to **10 requests per minute** to prevent abuse.  
- **Default port:** The server runs on **port 8000**. Update the code if needed.  

