---
description: Cache service management and optimization workflow
---

# Cache Service Management Workflow

This workflow provides a structured approach to managing and optimizing the cache service in the template-nodejs project.

## **Steps**

### **1. Cache Service Analysis**
- Analyze current cache implementation and usage patterns
- Review cache key organization and TTL settings
- Identify performance bottlenecks and optimization opportunities
- Check Redis connection health and configuration

### **2. Cache Configuration Review**
// turbo
- Validate Redis URL configuration in environment variables
- Review cache TTL settings for different data types
- Check memory-based fallback configuration
- Verify cache key patterns and naming conventions

### **3. Performance Optimization**
- Implement cache warming strategies for frequently accessed data
- Optimize cache invalidation patterns
- Review cache hit/miss ratios and adjust TTLs accordingly
- Implement cache monitoring and alerting

### **4. Cache Service Testing**
- Test Redis connection failover scenarios
- Validate memory-based fallback functionality
- Test cache expiration and cleanup processes
- Verify cache key prefix deletion functionality

### **5. Documentation Updates**
- Update cache service documentation with current implementation
- Document cache key patterns and TTL strategies
- Add performance monitoring guidelines
- Update specialized services skills documentation

## **Cache Service Standards**

### **Cache Key Organization**
- Use consistent prefix patterns for different data types
- Follow the established CacheKeys pattern: `user:${id}`, `user:email:${email}`
- Implement hierarchical key structures for complex data
- Use descriptive key names that clearly indicate content type

### **TTL Management**
- Set appropriate TTLs based on data change frequency
- Use shorter TTLs for frequently changing data (5 minutes for users)
- Use longer TTLs for relatively static data (1 hour for roles)
- Implement cache warming strategies for critical data

### **Error Handling**
- Implement graceful fallback to memory cache when Redis is unavailable
- Log cache errors appropriately without impacting application performance
- Handle Redis connection errors with retry mechanisms
- Ensure cache failures don't cause application failures

### **Performance Monitoring**
- Monitor cache hit/miss ratios
- Track Redis connection health and response times
- Monitor memory usage in fallback cache
- Set up alerts for cache performance degradation

## **Integration Points**

### **Service Layer Integration**
- Integrate caching in repository layer for database queries
- Use cache-aside pattern for read operations
- Implement cache invalidation on data mutations
- Consider write-through caching for critical data

### **API Layer Integration**
- Cache API responses for frequently accessed endpoints
- Implement cache invalidation on data changes
- Use cache headers for HTTP response caching
- Consider CDN integration for static content

## **Best Practices**

### **Cache Design**
- Design cache keys with clear hierarchy and patterns
- Use appropriate TTLs based on data characteristics
- Implement cache warming for critical data
- Consider cache coherency in distributed systems

### **Security Considerations**
- Never cache sensitive user data without proper encryption
- Implement cache access controls and permissions
- Use secure cache key naming to avoid information leakage
- Regular audit cached data for compliance requirements

### **Maintenance**
- Regular cache cleanup and optimization
- Monitor cache performance and capacity
- Update cache strategies based on usage patterns
- Document cache decisions and configurations

## **Troubleshooting**

### **Common Issues**
- Redis connection failures and fallback behavior
- Cache key conflicts and naming issues
- TTL configuration problems
- Memory cache overflow and cleanup issues

### **Debugging Tools**
- Redis CLI for direct cache inspection
- Application logs for cache operation tracking
- Performance monitoring tools for cache metrics
- Memory profiling for cache usage analysis

This workflow ensures the cache service remains optimized, well-documented, and aligned with project standards while providing reliable performance and fallback mechanisms.
