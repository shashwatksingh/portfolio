# Concurrency Patterns in Go for Payment Processing Systems

Go's concurrency model, built around goroutines and channels, makes it an excellent choice for building high-throughput payment processing systems. In this article, we'll explore practical patterns for handling concurrent payment operations while maintaining correctness, idempotency, and fault tolerance.

## Why Go for Payment Systems?

Go offers several advantages for fintech applications:
- **Lightweight concurrency**: Goroutines use ~2KB of stack space vs threads (~1MB)
- **Built-in race detection**: `go run -race` catches concurrency bugs
- **Fast compilation**: Quick iteration during development
- **Strong standard library**: HTTP, JSON, crypto out of the box
- **Static typing**: Catch errors at compile time

## Goroutines vs Threads

```go
// Traditional threading (expensive)
// Each thread: ~1MB stack
// 10,000 threads = ~10GB memory

// Go goroutines (lightweight)
// Each goroutine: ~2KB stack
// 10,000 goroutines = ~20MB memory

func main() {
    // Spawn 100,000 concurrent payment processors
    for i := 0; i < 100000; i++ {
        go processPayment(i) // Only ~200MB total!
    }
}
```

## Pattern 1: Worker Pool for Payment Processing

Handle high-volume payment requests efficiently.

```go
package main

import (
    "context"
    "fmt"
    "sync"
    "time"
)

type Payment struct {
    ID            string
    Amount        float64
    Currency      string
    IdempotencyKey string
}

type PaymentResult struct {
    Payment *Payment
    Success bool
    Error   error
}

// Worker pool implementation
type PaymentProcessor struct {
    workers    int
    jobQueue   chan *Payment
    resultChan chan *PaymentResult
    wg         sync.WaitGroup
}

func NewPaymentProcessor(workers int, queueSize int) *PaymentProcessor {
    return &PaymentProcessor{
        workers:    workers,
        jobQueue:   make(chan *Payment, queueSize),
        resultChan: make(chan *PaymentResult, queueSize),
    }
}

func (p *PaymentProcessor) Start(ctx context.Context) {
    // Start worker goroutines
    for i := 0; i < p.workers; i++ {
        p.wg.Add(1)
        go p.worker(ctx, i)
    }
}

func (p *PaymentProcessor) worker(ctx context.Context, id int) {
    defer p.wg.Done()
    
    fmt.Printf("Worker %d started\n", id)
    
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("Worker %d shutting down\n", id)
            return
            
        case payment, ok := <-p.jobQueue:
            if !ok {
                return
            }
            
            // Process payment
            result := p.processPayment(payment)
            
            // Send result
            select {
            case p.resultChan <- result:
            case <-ctx.Done():
                return
            }
        }
    }
}

func (p *PaymentProcessor) processPayment(payment *Payment) *PaymentResult {
    // Simulate payment processing
    time.Sleep(100 * time.Millisecond)
    
    // Validate payment
    if payment.Amount <= 0 {
        return &PaymentResult{
            Payment: payment,
            Success: false,
            Error:   fmt.Errorf("invalid amount: %f", payment.Amount),
        }
    }
    
    // Process with payment gateway
    // In real implementation: call Stripe, PayPal, etc.
    
    return &PaymentResult{
        Payment: payment,
        Success: true,
        Error:   nil,
    }
}

func (p *PaymentProcessor) Submit(payment *Payment) {
    p.jobQueue <- payment
}

func (p *PaymentProcessor) Results() <-chan *PaymentResult {
    return p.resultChan
}

func (p *PaymentProcessor) Shutdown() {
    close(p.jobQueue)
    p.wg.Wait()
    close(p.resultChan)
}

// Usage
func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    
    // Create processor with 10 workers
    processor := NewPaymentProcessor(10, 100)
    processor.Start(ctx)
    
    // Submit payments
    go func() {
        for i := 0; i < 100; i++ {
            payment := &Payment{
                ID:       fmt.Sprintf("PAY-%d", i),
                Amount:   100.50,
                Currency: "USD",
            }
            processor.Submit(payment)
        }
    }()
    
    // Collect results
    processed := 0
    for result := range processor.Results() {
        if result.Success {
            fmt.Printf("Payment %s processed successfully\n", result.Payment.ID)
        } else {
            fmt.Printf("Payment %s failed: %v\n", result.Payment.ID, result.Error)
        }
        
        processed++
        if processed == 100 {
            break
        }
    }
    
    processor.Shutdown()
}
```

## Pattern 2: Idempotent Payment Handler

Ensure payments can be safely retried.

```go
package main

import (
    "context"
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "sync"
    "time"
)

type IdempotentPaymentService struct {
    cache      sync.Map // Thread-safe map for idempotency
    mu         sync.RWMutex
    processing map[string]*sync.Mutex // Per-key locks
}

func NewIdempotentPaymentService() *IdempotentPaymentService {
    return &IdempotentPaymentService{
        processing: make(map[string]*sync.Mutex),
    }
}

func (s *IdempotentPaymentService) ProcessPayment(
    ctx context.Context,
    payment *Payment,
) (*PaymentResult, error) {
    
    // Generate idempotency key if not provided
    if payment.IdempotencyKey == "" {
        payment.IdempotencyKey = s.generateIdempotencyKey(payment)
    }
    
    // Check cache first (fast path)
    if cached, ok := s.cache.Load(payment.IdempotencyKey); ok {
        return cached.(*PaymentResult), nil
    }
    
    // Get or create mutex for this idempotency key
    mutex := s.getOrCreateMutex(payment.IdempotencyKey)
    mutex.Lock()
    defer mutex.Unlock()
    
    // Double-check cache after acquiring lock
    if cached, ok := s.cache.Load(payment.IdempotencyKey); ok {
        return cached.(*PaymentResult), nil
    }
    
    // Process payment
    result := &PaymentResult{
        Payment: payment,
        Success: true,
    }
    
    // Simulate payment gateway call
    select {
    case <-ctx.Done():
        return nil, ctx.Err()
    case <-time.After(100 * time.Millisecond):
        // Payment processed
    }
    
    // Cache result (TTL: 24 hours in production)
    s.cache.Store(payment.IdempotencyKey, result)
    
    // Schedule cache cleanup
    go s.cleanupCache(payment.IdempotencyKey, 24*time.Hour)
    
    return result, nil
}

func (s *IdempotentPaymentService) getOrCreateMutex(key string) *sync.Mutex {
    s.mu.Lock()
    defer s.mu.Unlock()
    
    if mutex, ok := s.processing[key]; ok {
        return mutex
    }
    
    mutex := &sync.Mutex{}
    s.processing[key] = mutex
    return mutex
}

func (s *IdempotentPaymentService) generateIdempotencyKey(payment *Payment) string {
    data := fmt.Sprintf("%s:%f:%s", payment.ID, payment.Amount, payment.Currency)
    hash := sha256.Sum256([]byte(data))
    return hex.EncodeToString(hash[:])
}

func (s *IdempotentPaymentService) cleanupCache(key string, ttl time.Duration) {
    time.Sleep(ttl)
    s.cache.Delete(key)
    
    s.mu.Lock()
    delete(s.processing, key)
    s.mu.Unlock()
}
```

## Pattern 3: Rate Limiting with Token Bucket

Protect payment gateway from overload.

```go
package main

import (
    "context"
    "fmt"
    "sync"
    "time"
)

type TokenBucket struct {
    capacity   int
    tokens     int
    refillRate time.Duration
    mu         sync.Mutex
    lastRefill time.Time
}

func NewTokenBucket(capacity int, refillRate time.Duration) *TokenBucket {
    return &TokenBucket{
        capacity:   capacity,
        tokens:     capacity,
        refillRate: refillRate,
        lastRefill: time.Now(),
    }
}

func (tb *TokenBucket) Allow() bool {
    tb.mu.Lock()
    defer tb.mu.Unlock()
    
    // Refill tokens based on elapsed time
    now := time.Now()
    elapsed := now.Sub(tb.lastRefill)
    tokensToAdd := int(elapsed / tb.refillRate)
    
    if tokensToAdd > 0 {
        tb.tokens = min(tb.capacity, tb.tokens+tokensToAdd)
        tb.lastRefill = now
    }
    
    // Check if token available
    if tb.tokens > 0 {
        tb.tokens--
        return true
    }
    
    return false
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}

// Rate-limited payment processor
type RateLimitedPaymentProcessor struct {
    limiter *TokenBucket
    processor *PaymentProcessor
}

func NewRateLimitedPaymentProcessor(
    rps int,
    workers int,
) *RateLimitedPaymentProcessor {
    
    return &RateLimitedPaymentProcessor{
        limiter:   NewTokenBucket(rps, time.Second/time.Duration(rps)),
        processor: NewPaymentProcessor(workers, 1000),
    }
}

func (p *RateLimitedPaymentProcessor) ProcessPayment(
    ctx context.Context,
    payment *Payment,
) error {
    
    // Wait for rate limit
    for {
        if p.limiter.Allow() {
            break
        }
        
        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-time.After(10 * time.Millisecond):
            // Retry
        }
    }
    
    // Submit to processor
    p.processor.Submit(payment)
    return nil
}
```

## Pattern 4: Circuit Breaker for Payment Gateway

Prevent cascading failures when payment gateway is down.

```go
package main

import (
    "errors"
    "sync"
    "time"
)

type CircuitState int

const (
    StateClosed CircuitState = iota
    StateOpen
    StateHalfOpen
)

type CircuitBreaker struct {
    maxFailures  int
    timeout      time.Duration
    state        CircuitState
    failures     int
    lastFailTime time.Time
    mu           sync.RWMutex
}

func NewCircuitBreaker(maxFailures int, timeout time.Duration) *CircuitBreaker {
    return &CircuitBreaker{
        maxFailures: maxFailures,
        timeout:     timeout,
        state:       StateClosed,
    }
}

func (cb *CircuitBreaker) Call(fn func() error) error {
    cb.mu.Lock()
    
    // Check if circuit should transition from Open to HalfOpen
    if cb.state == StateOpen {
        if time.Since(cb.lastFailTime) > cb.timeout {
            cb.state = StateHalfOpen
            cb.failures = 0
        } else {
            cb.mu.Unlock()
            return errors.New("circuit breaker is open")
        }
    }
    
    cb.mu.Unlock()
    
    // Execute function
    err := fn()
    
    cb.mu.Lock()
    defer cb.mu.Unlock()
    
    if err != nil {
        cb.failures++
        cb.lastFailTime = time.Now()
        
        if cb.failures >= cb.maxFailures {
            cb.state = StateOpen
        }
        
        return err
    }
    
    // Success - reset circuit
    if cb.state == StateHalfOpen {
        cb.state = StateClosed
    }
    cb.failures = 0
    
    return nil
}

// Payment gateway with circuit breaker
type ResilientPaymentGateway struct {
    breaker *CircuitBreaker
}

func NewResilientPaymentGateway() *ResilientPaymentGateway {
    return &ResilientPaymentGateway{
        breaker: NewCircuitBreaker(5, 30*time.Second),
    }
}

func (g *ResilientPaymentGateway) Charge(payment *Payment) error {
    return g.breaker.Call(func() error {
        // Actual payment gateway call
        return g.callPaymentGateway(payment)
    })
}

func (g *ResilientPaymentGateway) callPaymentGateway(payment *Payment) error {
    // Simulate gateway call
    time.Sleep(50 * time.Millisecond)
    return nil
}
```

## Pattern 5: Distributed Lock for Concurrent Payments

Prevent double-charging using distributed locks.

```go
package main

import (
    "context"
    "fmt"
    "time"
    
    "github.com/go-redis/redis/v8"
)

type DistributedLock struct {
    client *redis.Client
}

func NewDistributedLock(redisAddr string) *DistributedLock {
    return &DistributedLock{
        client: redis.NewClient(&redis.Options{
            Addr: redisAddr,
        }),
    }
}

func (dl *DistributedLock) AcquireLock(
    ctx context.Context,
    key string,
    ttl time.Duration,
) (bool, error) {
    
    // SET key value NX EX ttl
    result, err := dl.client.SetNX(ctx, key, "locked", ttl).Result()
    return result, err
}

func (dl *DistributedLock) ReleaseLock(ctx context.Context, key string) error {
    return dl.client.Del(ctx, key).Err()
}

// Payment service with distributed locking
type DistributedPaymentService struct {
    lock *DistributedLock
}

func (s *DistributedPaymentService) ProcessPayment(
    ctx context.Context,
    payment *Payment,
) (*PaymentResult, error) {
    
    lockKey := fmt.Sprintf("payment:lock:%s", payment.ID)
    
    // Try to acquire lock
    acquired, err := s.lock.AcquireLock(ctx, lockKey, 30*time.Second)
    if err != nil {
        return nil, err
    }
    
    if !acquired {
        return nil, errors.New("payment already being processed")
    }
    
    defer s.lock.ReleaseLock(ctx, lockKey)
    
    // Process payment
    result := &PaymentResult{
        Payment: payment,
        Success: true,
    }
    
    return result, nil
}
```

## Pattern 6: Fan-Out/Fan-In for Multi-Gateway Processing

Try multiple payment gateways concurrently.

```go
package main

import (
    "context"
    "fmt"
    "sync"
)

type Gateway interface {
    Charge(ctx context.Context, payment *Payment) (*PaymentResult, error)
    Name() string
}

type StripeGateway struct{}
func (g *StripeGateway) Name() string { return "Stripe" }
func (g *StripeGateway) Charge(ctx context.Context, p *Payment) (*PaymentResult, error) {
    // Stripe implementation
    return &PaymentResult{Payment: p, Success: true}, nil
}

type PayPalGateway struct{}
func (g *PayPalGateway) Name() string { return "PayPal" }
func (g *PayPalGateway) Charge(ctx context.Context, p *Payment) (*PaymentResult, error) {
    // PayPal implementation
    return &PaymentResult{Payment: p, Success: true}, nil
}

type MultiGatewayProcessor struct {
    gateways []Gateway
}

func NewMultiGatewayProcessor(gateways []Gateway) *MultiGatewayProcessor {
    return &MultiGatewayProcessor{gateways: gateways}
}

func (p *MultiGatewayProcessor) ProcessPayment(
    ctx context.Context,
    payment *Payment,
) (*PaymentResult, error) {
    
    // Fan-out: try all gateways concurrently
    results := make(chan *PaymentResult, len(p.gateways))
    errors := make(chan error, len(p.gateways))
    
    var wg sync.WaitGroup
    
    for _, gateway := range p.gateways {
        wg.Add(1)
        
        go func(gw Gateway) {
            defer wg.Done()
            
            result, err := gw.Charge(ctx, payment)
            if err != nil {
                errors <- fmt.Errorf("%s failed: %w", gw.Name(), err)
                return
            }
            
            results <- result
        }(gateway)
    }
    
    // Close channels when all goroutines complete
    go func() {
        wg.Wait()
        close(results)
        close(errors)
    }()
    
    // Fan-in: return first successful result
    select {
    case result := <-results:
        return result, nil
    case err := <-errors:
        // Log error but continue waiting for success
        fmt.Printf("Gateway error: %v\n", err)
    case <-ctx.Done():
        return nil, ctx.Err()
    }
    
    return nil, fmt.Errorf("all gateways failed")
}
```

## Pattern 7: Graceful Shutdown

Ensure in-flight payments complete before shutdown.

```go
package main

import (
    "context"
    "os"
    "os/signal"
    "sync"
    "syscall"
    "time"
)

type GracefulPaymentService struct {
    processor  *PaymentProcessor
    wg         sync.WaitGroup
    shutdownCh chan struct{}
}

func NewGracefulPaymentService() *GracefulPaymentService {
    return &GracefulPaymentService{
        processor:  NewPaymentProcessor(10, 100),
        shutdownCh: make(chan struct{}),
    }
}

func (s *GracefulPaymentService) Start(ctx context.Context) {
    s.processor.Start(ctx)
    
    // Handle shutdown signals
    sigCh := make(chan os.Signal, 1)
    signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
    
    go func() {
        <-sigCh
        fmt.Println("Shutdown signal received")
        s.Shutdown()
    }()
}

func (s *GracefulPaymentService) ProcessPayment(payment *Payment) {
    s.wg.Add(1)
    
    go func() {
        defer s.wg.Done()
        
        select {
        case <-s.shutdownCh:
            fmt.Printf("Rejecting payment %s due to shutdown\n", payment.ID)
            return
        default:
            s.processor.Submit(payment)
        }
    }()
}

func (s *GracefulPaymentService) Shutdown() {
    close(s.shutdownCh)
    
    // Wait for in-flight payments with timeout
    done := make(chan struct{})
    
    go func() {
        s.wg.Wait()
        close(done)
    }()
    
    select {
    case <-done:
        fmt.Println("All payments completed")
    case <-time.After(30 * time.Second):
        fmt.Println("Shutdown timeout - forcing exit")
    }
    
    s.processor.Shutdown()
}
```

## Real-World Example: Complete Payment Service

```go
package main

import (
    "context"
    "fmt"
    "time"
)

type PaymentService struct {
    processor   *PaymentProcessor
    idempotency *IdempotentPaymentService
    rateLimiter *TokenBucket
    breaker     *CircuitBreaker
}

func NewPaymentService() *PaymentService {
    return &PaymentService{
        processor:   NewPaymentProcessor(20, 1000),
        idempotency: NewIdempotentPaymentService(),
        rateLimiter: NewTokenBucket(100, 10*time.Millisecond), // 100 RPS
        breaker:     NewCircuitBreaker(10, 1*time.Minute),
    }
}

func (s *PaymentService) ProcessPayment(
    ctx context.Context,
    payment *Payment,
) (*PaymentResult, error) {
    
    // 1. Check idempotency
    result, err := s.idempotency.ProcessPayment(ctx, payment)
    if err == nil {
        return result, nil
    }
    
    // 2. Rate limiting
    if !s.rateLimiter.Allow() {
        return nil, fmt.Errorf("rate limit exceeded")
    }
    
    // 3. Circuit breaker
    err = s.breaker.Call(func() error {
        s.processor.Submit(payment)
        return nil
    })
    
    if err != nil {
        return nil, err
    }
    
    // 4. Wait for result
    select {
    case result := <-s.processor.Results():
        return result, nil
    case <-ctx.Done():
        return nil, ctx.Err()
    }
}

func main() {
    ctx := context.Background()
    service := NewPaymentService()
    
    service.processor.Start(ctx)
    defer service.processor.Shutdown()
    
    // Process payment
    payment := &Payment{
        ID:       "PAY-123",
        Amount:   99.99,
        Currency: "USD",
    }
    
    result, err := service.ProcessPayment(ctx, payment)
    if err != nil {
        fmt.Printf("Payment failed: %v\n", err)
        return
    }
    
    fmt.Printf("Payment processed: %+v\n", result)
}
```

## Best Practices

### 1. Always Use Context for Cancellation
```go
func processPayment(ctx context.Context, payment *Payment) error {
    select {
    case <-ctx.Done():
        return ctx.Err()
    default:
        // Process payment
    }
}
```

### 2. Avoid Goroutine Leaks
```go
// BAD: Goroutine may leak
go func() {
    for {
        processPayment()
    }
}()

// GOOD: Goroutine can be stopped
go func() {
    for {
        select {
        case <-ctx.Done():
            return
        default:
            processPayment()
        }
    }
}()
```

### 3. Use Buffered Channels Wisely
```go
// Unbuffered: Sender blocks until receiver ready
ch := make(chan *Payment)

// Buffered: Sender blocks only when buffer full
ch := make(chan *Payment, 100)
```

### 4. Handle Panics in Goroutines
```go
go func() {
    defer func() {
        if r := recover(); r != nil {
            log.Printf("Recovered from panic: %v", r)
        }
    }()
    
    processPayment()
}()
```

## Conclusion

Go's concurrency primitives make it ideal for building high-performance payment systems. Key takeaways:

- Use **worker pools** for bounded concurrency
- Implement **idempotency** for safe retries
- Add **rate limiting** to protect downstream services
- Use **circuit breakers** for fault tolerance
- Always handle **graceful shutdown**
- Test with **race detector**: `go test -race`

These patterns will help you build robust, scalable payment processing systems that can handle millions of transactions reliably.

## References

- [Go Concurrency Patterns](https://go.dev/blog/pipelines)
- [Effective Go](https://go.dev/doc/effective_go)
- [Concurrency in Go (Book)](https://www.oreilly.com/library/view/concurrency-in-go/9781491941294/)
