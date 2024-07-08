# blog 서버 구현

## `.env` 파일

```
DATABASE_URI=<MONGO_DB_URI>
ACCESS_TOKEN_SECRET=<ACCESS_TOKEN_SECRET_KEY>
REFRESH_TOKEN_SECRET=<REFRESH_TOKEN_SECRET_KEY>
PORT=3000
```

- cf: ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET 생성방법

  1. `$node`
  2. `$ require('crypto').randomBytes(64).toString('hex')`
