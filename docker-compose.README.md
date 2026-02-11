# Docker Compose для локальной разработки

Этот docker-compose файл запускает PostgreSQL и MinIO (объектное хранилище) для локальной разработки.

## Запуск

```bash
# Запустить все сервисы
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановить все сервисы
docker-compose down

# Остановить и удалить volumes (очистить данные)
docker-compose down -v
```

## Сервисы

### PostgreSQL
- **Порт**: 5432
- **База данных**: rentflow
- **Пользователь**: postgres
- **Пароль**: postgres
- **URL подключения**: `jdbc:postgresql://localhost:5432/rentflow`

### MinIO (Object Storage)
- **API Endpoint**: http://localhost:9000
- **Console UI**: http://localhost:9001
- **Root User**: minioadmin
- **Root Password**: minioadmin
- **Bucket**: rentflow-bucket (создается автоматически)

## Переменные окружения для приложения

После запуска docker-compose, используйте следующие переменные окружения:

```bash
# PostgreSQL
DATABASE_URL=jdbc:postgresql://localhost:5432/rentflow
DB_USERNAME=postgres
DB_PASSWORD=postgres

# MinIO (для локальной разработки с Google Cloud Storage SDK)
# Примечание: MinIO совместим с S3 API, но для полной совместимости с GCS
# может потребоваться дополнительная настройка или использование S3 SDK
DEFAULT_OBJECT_STORAGE_BUCKET_ID=rentflow-bucket
PUBLIC_OBJECT_SEARCH_PATHS=public
PRIVATE_OBJECT_DIR=.private
```

## Доступ к MinIO Console

1. Откройте http://localhost:9001
2. Войдите с учетными данными:
   - Username: `minioadmin`
   - Password: `minioadmin`

## Примечания

- Данные PostgreSQL сохраняются в volume `postgres_data`
- Данные MinIO сохраняются в volume `minio_data`
- Bucket `rentflow-bucket` создается автоматически при первом запуске
- Bucket настроен как публичный для упрощения разработки
