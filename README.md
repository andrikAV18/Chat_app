# Deep Chat - Real-time Chat Application

A real-time chat application built with Spring Boot, WebSockets, and PostgreSQL.

## Features

- 🔐 User authentication (login/register/logout)
- 💬 Real-time messaging with WebSockets
- 📢 Multiple chat channels (General, Random, Dev)
- 👥 User status tracking (Online/Offline)
- 🎨 Modern dark theme UI

## Tech Stack

- **Backend:** Spring Boot 3.2, Spring Security, Spring WebSocket
- **Database:** PostgreSQL
- **Frontend:** HTML, CSS, JavaScript, SockJS, STOMP

## Local Development

### Prerequisites
- Java 21
- Maven
- PostgreSQL

### Setup

1. Clone the repository:
```bash
git clone https://github.com/sujan58/Chat_app.git
cd Chat_app
```

2. Configure database in `src/main/resources/application.properties` or set environment variables:
```properties
DATABASE_URL=jdbc:postgresql://localhost:5432/your_database
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
```

3. Run the application:
```bash
mvn spring-boot:run
```

4. Open http://localhost:8080 in your browser

### Default Users
- `admin` / `admin`
- `user` / `user`

## Deployment

### Deploy to Railway

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repository
4. Add a PostgreSQL database from the Railway dashboard
5. Railway will auto-detect the Java app and deploy it

### Deploy to Render

1. Go to [Render](https://render.com)
2. Create a new "Web Service"
3. Connect your GitHub repository
4. Set environment variables:
   - `DATABASE_URL`
   - `DATABASE_USERNAME`
   - `DATABASE_PASSWORD`
5. Deploy!

### Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 8080) |
| `DATABASE_URL` | PostgreSQL JDBC URL |
| `DATABASE_USERNAME` | Database username |
| `DATABASE_PASSWORD` | Database password |

## Testing Multiple Users

To test with different users simultaneously:
- Use an **incognito/private window** for the second user
- Or use a **different browser**

## License

MIT
