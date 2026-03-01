# Understanding JVM Garbage Collection for High-Performance Applications

In the world of high-frequency trading, payment processing, and real-time financial systems, understanding JVM garbage collection (GC) is not just an optimization—it's a necessity. A poorly tuned GC can introduce latency spikes that cost millions in lost transactions or degraded user experience.

## Why GC Matters in Fintech

Financial applications demand:
- **Low latency**: Sub-millisecond response times for trading systems
- **High throughput**: Processing millions of transactions per second
- **Predictable performance**: No unexpected pauses that could impact SLAs
- **Memory efficiency**: Optimal resource utilization in cloud environments

## Understanding JVM Memory Model

Before diving into GC algorithms, let's understand the JVM heap structure:

```java
// Heap is divided into generations
Young Generation (Eden + Survivor Spaces)
  ├── Eden Space (where new objects are allocated)
  ├── Survivor Space S0
  └── Survivor Space S1

Old Generation (Tenured)
  └── Long-lived objects promoted from Young Gen

Metaspace (Non-Heap)
  └── Class metadata, method data
```

### Object Lifecycle

```java
public class PaymentProcessor {
    // Short-lived objects (Young Gen)
    public void processPayment(PaymentRequest request) {
        // These objects die quickly after method execution
        String transactionId = UUID.randomUUID().toString();
        BigDecimal amount = request.getAmount();
        
        // Long-lived objects (eventually Old Gen)
        Transaction transaction = new Transaction(transactionId, amount);
        transactionRepository.save(transaction); // Persisted reference
    }
}
```

## Major GC Algorithms

### 1. Serial GC (Not for Production Fintech)

```bash
-XX:+UseSerialGC
```

**Characteristics:**
- Single-threaded collection
- Stop-the-world pauses
- Suitable only for small applications (<100MB heap)

**Verdict:** ❌ Never use in production fintech systems

### 2. Parallel GC (Throughput Collector)

```bash
-XX:+UseParallelGC
-XX:ParallelGCThreads=8
-XX:MaxGCPauseMillis=200
```

**Characteristics:**
- Multi-threaded Young and Old generation collection
- Optimized for throughput
- Longer pause times acceptable

**Use Case:** Batch payment processing where throughput > latency

```java
// Example: Batch payment processor
public class BatchPaymentProcessor {
    @Scheduled(cron = "0 0 2 * * *") // 2 AM daily
    public void processBatchPayments() {
        // Process 10M transactions
        // GC pauses acceptable during off-peak hours
        List<Payment> payments = paymentRepository.findPendingPayments();
        payments.parallelStream()
               .forEach(this::processPayment);
    }
}
```

### 3. G1GC (Garbage First) - Recommended for Most Fintech Apps

```bash
-XX:+UseG1GC
-XX:MaxGCPauseMillis=50
-XX:G1HeapRegionSize=16m
-XX:InitiatingHeapOccupancyPercent=45
-XX:G1ReservePercent=10
```

**Characteristics:**
- Divides heap into regions
- Predictable pause times
- Concurrent marking phase
- Incremental compaction

**Architecture:**

```
Heap divided into 2048 regions (each 1-32MB)
┌─────────────────────────────────────┐
│ Eden │ Survivor │ Old │ Humongous  │
│ Eden │ Old      │ Old │ Free       │
│ Eden │ Old      │ Old │ Free       │
└─────────────────────────────────────┘
```

**Real-World Configuration for Payment API:**

```java
// JVM Flags for 8GB heap payment processing service
-Xms8g -Xmx8g
-XX:+UseG1GC
-XX:MaxGCPauseMillis=50
-XX:G1HeapRegionSize=16m
-XX:InitiatingHeapOccupancyPercent=45
-XX:G1ReservePercent=10
-XX:+ParallelRefProcEnabled
-XX:+UseStringDeduplication
```

**Monitoring G1GC:**

```java
import java.lang.management.GarbageCollectorMXBean;
import java.lang.management.ManagementFactory;

public class GCMonitor {
    public void logGCStats() {
        for (GarbageCollectorMXBean gc : 
             ManagementFactory.getGarbageCollectorMXBeans()) {
            
            System.out.printf("GC Name: %s%n", gc.getName());
            System.out.printf("Collection Count: %d%n", gc.getCollectionCount());
            System.out.printf("Collection Time: %dms%n", gc.getCollectionTime());
        }
    }
}
```

### 4. ZGC (Z Garbage Collector) - Ultra-Low Latency

```bash
-XX:+UseZGC
-XX:ZCollectionInterval=5
-XX:ZAllocationSpikeTolerance=2
```

**Characteristics:**
- Sub-millisecond pause times (typically <1ms)
- Concurrent compaction
- Scalable (8MB to 16TB heaps)
- Colored pointers for concurrent operations

**Use Case:** High-frequency trading, real-time payment processing

```java
// HFT Order Matching Engine
public class OrderMatchingEngine {
    private final ConcurrentHashMap<String, Order> orderBook;
    
    // ZGC ensures <1ms pauses even with millions of orders
    public void matchOrder(Order incomingOrder) {
        // Critical path - cannot tolerate GC pauses
        Order matchingOrder = findMatch(incomingOrder);
        if (matchingOrder != null) {
            executeTrade(incomingOrder, matchingOrder);
        }
    }
}
```

**ZGC Configuration for Trading System:**

```bash
-Xms16g -Xmx16g
-XX:+UseZGC
-XX:ZCollectionInterval=5
-XX:ConcGCThreads=4
-XX:+UnlockDiagnosticVMOptions
-XX:+ZProactive
```

### 5. Shenandoah GC - Alternative Low-Latency Collector

```bash
-XX:+UseShenandoahGC
-XX:ShenandoahGCHeuristics=adaptive
```

**Characteristics:**
- Concurrent evacuation
- Pause times independent of heap size
- Lower throughput than ZGC but more predictable

## GC Tuning Strategy for Fintech

### Step 1: Establish Baseline Metrics

```java
// Enable GC logging
-Xlog:gc*:file=/var/log/app/gc.log:time,uptime,level,tags
-XX:+PrintGCDetails
-XX:+PrintGCDateStamps
```

### Step 2: Analyze GC Logs

```bash
# Parse GC logs to find issues
grep "Full GC" gc.log | wc -l  # Should be minimal
grep "pause" gc.log | awk '{sum+=$NF; count++} END {print sum/count}'
```

### Step 3: Optimize Object Allocation

```java
// BAD: Creates excessive garbage
public String processTransaction(Transaction tx) {
    String result = "";
    for (Field field : tx.getFields()) {
        result += field.getName() + "=" + field.getValue() + ";";
    }
    return result;
}

// GOOD: Reduces garbage
public String processTransaction(Transaction tx) {
    StringBuilder result = new StringBuilder(256);
    for (Field field : tx.getFields()) {
        result.append(field.getName())
              .append("=")
              .append(field.getValue())
              .append(";");
    }
    return result.toString();
}
```

### Step 4: Object Pooling for Hot Paths

```java
import org.apache.commons.pool2.impl.GenericObjectPool;

public class PaymentProcessorPool {
    private final GenericObjectPool<PaymentProcessor> pool;
    
    public PaymentProcessorPool() {
        this.pool = new GenericObjectPool<>(
            new PaymentProcessorFactory(),
            createPoolConfig()
        );
    }
    
    public void processPayment(Payment payment) throws Exception {
        PaymentProcessor processor = pool.borrowObject();
        try {
            processor.process(payment);
        } finally {
            pool.returnObject(processor);
        }
    }
}
```

## Advanced Techniques

### 1. Escape Analysis and Scalar Replacement

```java
// JVM can allocate on stack instead of heap
public void processPayment() {
    Point point = new Point(10, 20); // May not allocate on heap
    int distance = point.distance();
    // point doesn't escape method
}
```

Enable with:
```bash
-XX:+DoEscapeAnalysis
-XX:+EliminateAllocations
```

### 2. TLAB (Thread-Local Allocation Buffers)

```java
// Each thread gets its own allocation buffer
-XX:TLABSize=256k
-XX:+ResizeTLAB
```

### 3. Humongous Objects Handling

```java
// Objects > 50% of G1 region size
// Allocated directly in Old Gen

// BAD: Creates humongous objects
byte[] largeArray = new byte[20 * 1024 * 1024]; // 20MB

// GOOD: Stream processing
try (InputStream is = new FileInputStream(file)) {
    byte[] buffer = new byte[8192];
    int bytesRead;
    while ((bytesRead = is.read(buffer)) != -1) {
        process(buffer, bytesRead);
    }
}
```

## Production Monitoring

### Key Metrics to Track

```java
import com.codahale.metrics.MetricRegistry;
import com.codahale.metrics.jvm.GarbageCollectorMetricSet;

public class GCMetrics {
    private final MetricRegistry metrics = new MetricRegistry();
    
    public void setupMetrics() {
        metrics.register("jvm.gc", new GarbageCollectorMetricSet());
        
        // Alert on:
        // - GC pause time > 50ms
        // - Full GC frequency > 1/hour
        // - Heap usage > 80%
    }
}
```

### NewRelic/DataDog Integration

```java
@Component
public class GCMonitoringService {
    
    @Scheduled(fixedRate = 60000)
    public void reportGCMetrics() {
        for (GarbageCollectorMXBean gc : 
             ManagementFactory.getGarbageCollectorMXBeans()) {
            
            NewRelic.recordMetric(
                "Custom/GC/" + gc.getName() + "/Count",
                gc.getCollectionCount()
            );
            
            NewRelic.recordMetric(
                "Custom/GC/" + gc.getName() + "/Time",
                gc.getCollectionTime()
            );
        }
    }
}
```

## Real-World Case Study: Payment Gateway Optimization

**Problem:** Payment API experiencing 99th percentile latency of 500ms

**Investigation:**
```bash
# GC logs showed frequent Full GCs
[Full GC (Allocation Failure) 6144M->5892M(8192M), 2.3 secs]
```

**Root Cause:**
- Undersized heap (8GB for 10K TPS)
- Parallel GC causing long pauses
- Memory leaks in cache layer

**Solution:**
```bash
# Switched to G1GC with larger heap
-Xms16g -Xmx16g
-XX:+UseG1GC
-XX:MaxGCPauseMillis=50
-XX:G1HeapRegionSize=16m

# Fixed cache eviction
@Cacheable(value = "payments", 
           cacheManager = "caffeineCacheManager")
public Payment getPayment(String id) {
    return paymentRepository.findById(id);
}
```

**Results:**
- 99th percentile latency: 500ms → 45ms
- Full GC frequency: 10/hour → 0/day
- Throughput: 10K TPS → 25K TPS

## Conclusion

For fintech applications:
- **Use G1GC** for most production workloads (good balance)
- **Use ZGC** for ultra-low latency requirements (<10ms p99)
- **Monitor continuously** with proper metrics and alerting
- **Tune iteratively** based on production traffic patterns
- **Test under load** before deploying GC changes

Remember: The best GC is the one that doesn't run. Optimize your code to reduce allocation rates first, then tune GC as needed.

## References

- [JEP 333: ZGC: A Scalable Low-Latency Garbage Collector](https://openjdk.org/jeps/333)
- [Getting Started with the G1 Garbage Collector](https://www.oracle.com/technical-resources/articles/java/g1gc.html)
- [Java Performance: The Definitive Guide](https://www.oreilly.com/library/view/java-performance-the/9781449363512/)
