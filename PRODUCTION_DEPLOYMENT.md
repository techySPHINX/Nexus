# Production Chat Application Deployment Guide

## 🚀 Production-Ready Chat Application

This guide will help you deploy a robust, scalable chat application that can handle 5k-10k concurrent users.

## 📋 Prerequisites

- Docker and Docker Compose
- Domain name with SSL certificate
- S3-compatible storage (AWS S3, DigitalOcean Spaces, or MinIO)
- Redis instance
- PostgreSQL database

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Frontend      │    │   Backend       │
│   (Nginx)       │◄──►│   (React)       │◄──►│   (NestJS)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SSL/TLS       │    │   CDN           │    │   Redis         │
│   Termination   │    │   (Optional)    │    │   (Pub/Sub)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   PostgreSQL    │
                                              │   Database      │
                                              └─────────────────┘
```

## 🔧 Key Features Implemented

### ✅ Horizontal Scaling
- **Redis Adapter**: Socket.IO with Redis adapter for multi-instance support
- **Load Balancing**: Nginx with sticky sessions for WebSocket connections
- **Stateless Design**: Backend instances can be scaled independently

### ✅ Performance Optimizations
- **Database Indexing**: Optimized queries with proper indexes
- **Redis Caching**: Message and conversation caching
- **Connection Pooling**: Efficient database connections
- **Rate Limiting**: Per-user message rate limiting

### ✅ Production Features
- **File Uploads**: S3-compatible storage with presigned URLs
- **Monitoring**: Prometheus metrics and Grafana dashboards
- **Logging**: Structured logging with Winston
- **Health Checks**: Comprehensive health monitoring
- **Security**: Rate limiting, CORS, security headers

## 🚀 Quick Deployment

### 1. Clone and Setup
```bash
git clone <your-repo>
cd Nexus
cp env.production.example .env.production
```

### 2. Configure Environment
Edit `.env.production` with your actual values:
```bash
# Database
POSTGRES_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password
JWT_SECRET=your_32_character_secret_key

# S3 Storage
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your-bucket-name

# Domain
FRONTEND_URLS=https://your-domain.com
REACT_APP_API_URL=https://api.your-domain.com
REACT_APP_WS_URL=wss://api.your-domain.com
```

### 3. Deploy with Docker
```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f backend
```

### 4. Initialize Database
```bash
# Run migrations
docker-compose -f docker-compose.production.yml exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose -f docker-compose.production.yml exec backend npx prisma generate
```

## 📊 Monitoring Setup

### Access Monitoring Dashboards
- **Grafana**: http://your-domain.com:3002 (admin/your_grafana_password)
- **Prometheus**: http://your-domain.com:9090

### Key Metrics to Monitor
- Connected users count
- Messages per second
- Response times
- Error rates
- Database connection pool
- Redis memory usage

## 🔒 Security Configuration

### SSL/TLS Setup
1. Obtain SSL certificates (Let's Encrypt recommended)
2. Update `nginx.conf` with your certificate paths
3. Uncomment the HTTPS server block
4. Redirect HTTP to HTTPS

### Firewall Rules
```bash
# Allow only necessary ports
ufw allow 22    # SSH
ufw allow 80     # HTTP
ufw allow 443    # HTTPS
ufw enable
```

## 📈 Scaling Guidelines

### Horizontal Scaling
```bash
# Scale backend instances
docker-compose -f docker-compose.production.yml up -d --scale backend=3

# Update nginx upstream configuration
# Add more backend servers to nginx.conf
```

### Database Scaling
- **Read Replicas**: Add read-only PostgreSQL replicas
- **Connection Pooling**: Use PgBouncer for connection management
- **Partitioning**: Partition messages table by date for large datasets

### Redis Scaling
- **Redis Cluster**: For high availability and performance
- **Memory Optimization**: Configure appropriate memory policies
- **Persistence**: Configure RDB and AOF for data durability

## 🧪 Load Testing

### Test with Artillery
```bash
npm install -g artillery
artillery run load-test.yml
```

### Test with k6
```bash
# Install k6
curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz | tar xvz

# Run load test
./k6 run chat-load-test.js
```

## 🔧 Maintenance

### Backup Strategy
```bash
# Database backup
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U nexus nexus_chat > backup.sql

# Redis backup
docker-compose -f docker-compose.production.yml exec redis redis-cli BGSAVE
```

### Log Management
```bash
# Rotate logs
docker-compose -f docker-compose.production.yml exec backend logrotate /etc/logrotate.conf

# Monitor disk usage
df -h
du -sh /var/lib/docker/volumes/nexus_*/
```

## 🚨 Troubleshooting

### Common Issues

1. **WebSocket Connection Issues**
   - Check CORS configuration
   - Verify Redis adapter is working
   - Check firewall rules

2. **High Memory Usage**
   - Monitor Redis memory usage
   - Check for memory leaks in application
   - Optimize database queries

3. **Slow Response Times**
   - Check database query performance
   - Monitor Redis latency
   - Review Nginx configuration

### Health Checks
```bash
# Check all services
curl http://your-domain.com/health

# Check specific service
curl http://your-domain.com/api/health

# Check WebSocket
wscat -c wss://your-domain.com/ws
```

## 📚 Additional Resources

- [Socket.IO Scaling Guide](https://socket.io/docs/v4/scaling/)
- [NestJS Production Guide](https://docs.nestjs.com/techniques/performance)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Redis Best Practices](https://redis.io/docs/manual/admin/)

## 🎯 Performance Targets

With this setup, you should achieve:
- **5k-10k concurrent users** per backend instance
- **<100ms average response time** for messages
- **99.9% uptime** with proper monitoring
- **<1% error rate** under normal load

## 📞 Support

For issues or questions:
1. Check the logs: `docker-compose logs -f`
2. Monitor metrics in Grafana
3. Review this deployment guide
4. Check the troubleshooting section
