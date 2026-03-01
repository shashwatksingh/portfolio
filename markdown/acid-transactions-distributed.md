# Implementing ACID Transactions in Distributed Systems

In traditional monolithic applications, ACID (Atomicity, Consistency, Isolation, Durability) transactions are straightforward—your database handles them. But in distributed systems, especially in fintech where money is involved, maintaining ACID properties becomes significantly more complex and critical.

## The Challenge: CAP Theorem

Before diving into solutions, we must understand the fundamental constraint:

```
CAP Theorem: You can only guarantee 2 of 3:
├── Consistency: All nodes see the same data
├── Availability: System remains operational
└── Partition Tolerance: System works despite network failures
```

For financial systems, we typically choose **CP (Consistency + Partition Tolerance)** over availability because incorrect balances are unacceptable.

## ACID Properties in Distributed Context

### Atomicity
All operations in a transaction succeed or all fail—no partial updates.

```java
// Example: Money transfer must be atomic
public void transferMoney(String fromAccount, String toAccount, BigDecimal amount) {
    // Both operations must succeed or both must fail
    debit(fromAccount, amount);  // Operation 1
    credit(toAccount, amount);   // Operation 2
}
```

### Consistency
System moves from one valid state to another.

```java
// Invariant: Total money in system remains constant
assert(sumOfAllAccounts() == INITIAL_TOTAL);
```

### Isolation
Concurrent transactions don't interfere with each other.

```java
// Two simultaneous transfers shouldn't cause race conditions
Thread 1: transfer(A -> B, $100)
Thread 2: transfer(A -> C, $100)
// Account A must not go negative if balance is $150
```

### Durability
Committed transactions survive system failures.

```java
// After commit, data persists even if system crashes
transaction.commit();
// System crash here
// Data must still be present after recovery
```

## Pattern 1: Two-Phase Commit (2PC)

The classic distributed transaction protocol.

### How It Works

```
Coordinator                 Participant 1         Participant 2
    |                            |                     |
    |-------- PREPARE ---------->|                     |
    |-------- PREPARE --------------------------->|
    |                            |                     |
    |<------- VOTE YES ----------|                     |
    |<------- VOTE YES -------------------------|
    |                            |                     |
    |-------- COMMIT ----------->|                     |
    |-------- COMMIT --------------------------->|
    |                            |                     |
    |<------- ACK ---------------|                     |
    |<------- ACK ---------------------------|
```

### Implementation in Java

```java
public class TwoPhaseCommitCoordinator {
    private final List<TransactionParticipant> participants;
    private final TransactionLog transactionLog;
    
    public boolean executeTransaction(DistributedTransaction transaction) {
        String transactionId = UUID.randomUUID().toString();
        
        try {
            // Phase 1: Prepare
            transactionLog.logStart(transactionId);
            
            List<PrepareResponse> responses = participants.parallelStream()
                .map(p -> p.prepare(transactionId, transaction))
                .collect(Collectors.toList());
            
            // Check if all participants voted YES
            boolean allPrepared = responses.stream()
                .allMatch(PrepareResponse::isSuccess);
            
            if (!allPrepared) {
                // Phase 2a: Abort
                transactionLog.logAbort(transactionId);
                participants.forEach(p -> p.abort(transactionId));
                return false;
            }
            
            // Phase 2b: Commit
            transactionLog.logCommit(transactionId);
            participants.forEach(p -> p.commit(transactionId));
            
            return true;
            
        } catch (Exception e) {
            // Rollback on any error
            transactionLog.logAbort(transactionId);
            participants.forEach(p -> p.abort(transactionId));
            throw new TransactionException("Transaction failed", e);
        }
    }
}

public interface TransactionParticipant {
    PrepareResponse prepare(String txId, DistributedTransaction tx);
    void commit(String txId);
    void abort(String txId);
}

// Example participant: Account Service
@Service
public class AccountService implements TransactionParticipant {
    private final Map<String, TransactionState> pendingTransactions = 
        new ConcurrentHashMap<>();
    
    @Override
    public PrepareResponse prepare(String txId, DistributedTransaction tx) {
        try {
            // Lock resources
            Account account = accountRepository.findByIdWithLock(tx.getAccountId());
            
            // Validate business rules
            if (account.getBalance().compareTo(tx.getAmount()) < 0) {
                return PrepareResponse.failure("Insufficient funds");
            }
            
            // Store pending state
            TransactionState state = new TransactionState(account, tx);
            pendingTransactions.put(txId, state);
            
            return PrepareResponse.success();
            
        } catch (Exception e) {
            return PrepareResponse.failure(e.getMessage());
        }
    }
    
    @Override
    public void commit(String txId) {
        TransactionState state = pendingTransactions.remove(txId);
        if (state != null) {
            // Apply changes
            Account account = state.getAccount();
            account.setBalance(account.getBalance().subtract(state.getAmount()));
            accountRepository.save(account);
        }
    }
    
    @Override
    public void abort(String txId) {
        // Release locks and discard changes
        pendingTransactions.remove(txId);
    }
}
```

### Problems with 2PC

1. **Blocking**: If coordinator fails, participants are blocked
2. **Performance**: Synchronous, high latency
3. **Single point of failure**: Coordinator is critical

## Pattern 2: Saga Pattern

An alternative to 2PC that uses compensating transactions.

### Choreography-Based Saga

```java
// Each service publishes events, others react
public class PaymentSaga {
    
    @EventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        // Step 1: Reserve inventory
        inventoryService.reserveItems(event.getOrderId(), event.getItems());
    }
    
    @EventListener
    public void onInventoryReserved(InventoryReservedEvent event) {
        // Step 2: Process payment
        paymentService.processPayment(event.getOrderId(), event.getAmount());
    }
    
    @EventListener
    public void onPaymentFailed(PaymentFailedEvent event) {
        // Compensating transaction: Release inventory
        inventoryService.releaseItems(event.getOrderId());
    }
    
    @EventListener
    public void onPaymentSucceeded(PaymentSucceededEvent event) {
        // Step 3: Ship order
        shippingService.shipOrder(event.getOrderId());
    }
}
```

### Orchestration-Based Saga

```java
@Service
public class OrderSagaOrchestrator {
    
    public void processOrder(Order order) {
        SagaInstance saga = new SagaInstance(order.getId());
        
        try {
            // Step 1: Reserve inventory
            saga.addStep(
                () -> inventoryService.reserve(order.getItems()),
                () -> inventoryService.release(order.getItems())
            );
            
            // Step 2: Process payment
            saga.addStep(
                () -> paymentService.charge(order.getPaymentInfo()),
                () -> paymentService.refund(order.getPaymentInfo())
            );
            
            // Step 3: Update order status
            saga.addStep(
                () -> orderService.markAsConfirmed(order.getId()),
                () -> orderService.markAsCancelled(order.getId())
            );
            
            // Execute saga
            saga.execute();
            
        } catch (SagaException e) {
            // Automatic compensation
            saga.compensate();
            throw e;
        }
    }
}

public class SagaInstance {
    private final String sagaId;
    private final List<SagaStep> steps = new ArrayList<>();
    private final Stack<SagaStep> executedSteps = new Stack<>();
    
    public void addStep(Runnable forward, Runnable compensate) {
        steps.add(new SagaStep(forward, compensate));
    }
    
    public void execute() {
        for (SagaStep step : steps) {
            try {
                step.forward.run();
                executedSteps.push(step);
            } catch (Exception e) {
                compensate();
                throw new SagaException("Saga failed at step", e);
            }
        }
    }
    
    public void compensate() {
        while (!executedSteps.isEmpty()) {
            SagaStep step = executedSteps.pop();
            try {
                step.compensate.run();
            } catch (Exception e) {
                // Log compensation failure - critical!
                log.error("Compensation failed for saga {}", sagaId, e);
            }
        }
    }
}
```

## Pattern 3: Event Sourcing + CQRS

Store events instead of current state, ensuring perfect audit trail.

```java
// Event Store
@Entity
public class PaymentEvent {
    @Id
    private String eventId;
    private String aggregateId;
    private String eventType;
    private String payload;
    private LocalDateTime timestamp;
    private Long version;
}

// Aggregate Root
public class PaymentAggregate {
    private String paymentId;
    private BigDecimal amount;
    private PaymentStatus status;
    private Long version;
    
    private List<PaymentEvent> uncommittedEvents = new ArrayList<>();
    
    // Command: Initiate payment
    public void initiatePayment(BigDecimal amount) {
        // Validate
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        
        // Apply event
        PaymentInitiatedEvent event = new PaymentInitiatedEvent(
            UUID.randomUUID().toString(),
            amount,
            LocalDateTime.now()
        );
        
        apply(event);
        uncommittedEvents.add(event);
    }
    
    // Command: Complete payment
    public void completePayment() {
        if (status != PaymentStatus.PENDING) {
            throw new IllegalStateException("Payment not in pending state");
        }
        
        PaymentCompletedEvent event = new PaymentCompletedEvent(
            paymentId,
            LocalDateTime.now()
        );
        
        apply(event);
        uncommittedEvents.add(event);
    }
    
    // Event handlers (state changes)
    private void apply(PaymentInitiatedEvent event) {
        this.paymentId = event.getPaymentId();
        this.amount = event.getAmount();
        this.status = PaymentStatus.PENDING;
    }
    
    private void apply(PaymentCompletedEvent event) {
        this.status = PaymentStatus.COMPLETED;
    }
    
    // Rebuild from events
    public static PaymentAggregate fromEvents(List<PaymentEvent> events) {
        PaymentAggregate aggregate = new PaymentAggregate();
        events.forEach(aggregate::applyEvent);
        return aggregate;
    }
}

// Repository with optimistic locking
@Repository
public class PaymentAggregateRepository {
    
    @Transactional
    public void save(PaymentAggregate aggregate) {
        List<PaymentEvent> events = aggregate.getUncommittedEvents();
        
        for (PaymentEvent event : events) {
            event.setVersion(aggregate.getVersion() + 1);
            eventStore.save(event);
        }
        
        aggregate.markEventsAsCommitted();
    }
    
    public PaymentAggregate findById(String paymentId) {
        List<PaymentEvent> events = eventStore.findByAggregateId(paymentId);
        return PaymentAggregate.fromEvents(events);
    }
}
```

## Pattern 4: Outbox Pattern

Ensure reliable event publishing with database transactions.

```java
@Entity
@Table(name = "outbox")
public class OutboxEvent {
    @Id
    private String id;
    private String aggregateId;
    private String eventType;
    private String payload;
    private LocalDateTime createdAt;
    private boolean published;
}

@Service
public class PaymentService {
    
    @Transactional
    public void processPayment(Payment payment) {
        // 1. Update payment in database
        payment.setStatus(PaymentStatus.COMPLETED);
        paymentRepository.save(payment);
        
        // 2. Insert event into outbox table (same transaction)
        OutboxEvent event = new OutboxEvent();
        event.setId(UUID.randomUUID().toString());
        event.setAggregateId(payment.getId());
        event.setEventType("PaymentCompleted");
        event.setPayload(toJson(payment));
        event.setCreatedAt(LocalDateTime.now());
        event.setPublished(false);
        
        outboxRepository.save(event);
        
        // Transaction commits - both payment and event are saved atomically
    }
}

// Separate process publishes events
@Component
public class OutboxPublisher {
    
    @Scheduled(fixedDelay = 1000)
    @Transactional
    public void publishEvents() {
        List<OutboxEvent> unpublished = outboxRepository
            .findByPublishedFalse(PageRequest.of(0, 100));
        
        for (OutboxEvent event : unpublished) {
            try {
                // Publish to message broker
                kafkaTemplate.send("payment-events", event.getPayload());
                
                // Mark as published
                event.setPublished(true);
                outboxRepository.save(event);
                
            } catch (Exception e) {
                log.error("Failed to publish event {}", event.getId(), e);
                // Will retry on next iteration
            }
        }
    }
}
```

## Pattern 5: Idempotency Keys

Ensure operations can be safely retried.

```java
@Service
public class IdempotentPaymentService {
    
    @Transactional
    public PaymentResult processPayment(PaymentRequest request) {
        String idempotencyKey = request.getIdempotencyKey();
        
        // Check if already processed
        Optional<PaymentResult> existing = 
            paymentResultRepository.findByIdempotencyKey(idempotencyKey);
        
        if (existing.isPresent()) {
            // Return cached result
            return existing.get();
        }
        
        // Process payment
        Payment payment = new Payment();
        payment.setAmount(request.getAmount());
        payment.setStatus(PaymentStatus.PENDING);
        
        try {
            // Call payment gateway
            GatewayResponse response = paymentGateway.charge(request);
            
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setGatewayTransactionId(response.getTransactionId());
            
        } catch (Exception e) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setErrorMessage(e.getMessage());
        }
        
        paymentRepository.save(payment);
        
        // Cache result with idempotency key
        PaymentResult result = new PaymentResult(payment);
        result.setIdempotencyKey(idempotencyKey);
        paymentResultRepository.save(result);
        
        return result;
    }
}

// Client usage
public class PaymentClient {
    public void makePayment() {
        PaymentRequest request = new PaymentRequest();
        request.setAmount(new BigDecimal("100.00"));
        request.setIdempotencyKey(UUID.randomUUID().toString());
        
        // Safe to retry - same idempotency key
        PaymentResult result = paymentService.processPayment(request);
        
        if (result.getStatus() == PaymentStatus.FAILED) {
            // Retry with same key
            result = paymentService.processPayment(request);
        }
    }
}
```

## Real-World Example: Multi-Currency Payment System

```java
@Service
public class MultiCurrencyPaymentService {
    
    @Transactional
    public TransferResult transferMoney(
        String fromAccountId,
        String toAccountId,
        BigDecimal amount,
        Currency fromCurrency,
        Currency toCurrency
    ) {
        // Use Saga pattern for multi-step process
        SagaInstance saga = new SagaInstance();
        
        // Step 1: Lock source account
        saga.addStep(
            () -> {
                Account from = accountRepository.lockAccount(fromAccountId);
                if (from.getBalance().compareTo(amount) < 0) {
                    throw new InsufficientFundsException();
                }
            },
            () -> accountRepository.unlockAccount(fromAccountId)
        );
        
        // Step 2: Get exchange rate
        ExchangeRate rate = exchangeRateService.getRate(fromCurrency, toCurrency);
        BigDecimal convertedAmount = amount.multiply(rate.getRate());
        
        // Step 3: Debit source account
        saga.addStep(
            () -> accountRepository.debit(fromAccountId, amount),
            () -> accountRepository.credit(fromAccountId, amount)
        );
        
        // Step 4: Credit destination account
        saga.addStep(
            () -> accountRepository.credit(toAccountId, convertedAmount),
            () -> accountRepository.debit(toAccountId, convertedAmount)
        );
        
        // Step 5: Record transaction
        saga.addStep(
            () -> {
                Transaction tx = new Transaction();
                tx.setFromAccount(fromAccountId);
                tx.setToAccount(toAccountId);
                tx.setAmount(amount);
                tx.setConvertedAmount(convertedAmount);
                tx.setExchangeRate(rate.getRate());
                transactionRepository.save(tx);
            },
            () -> {} // No compensation needed for audit log
        );
        
        try {
            saga.execute();
            return TransferResult.success();
        } catch (Exception e) {
            saga.compensate();
            return TransferResult.failure(e.getMessage());
        }
    }
}
```

## Monitoring and Observability

```java
@Aspect
@Component
public class TransactionMonitoringAspect {
    
    @Around("@annotation(Transactional)")
    public Object monitorTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
        String txId = UUID.randomUUID().toString();
        long startTime = System.currentTimeMillis();
        
        try {
            Object result = joinPoint.proceed();
            
            long duration = System.currentTimeMillis() - startTime;
            
            // Record metrics
            metricsRegistry.counter("transactions.success").increment();
            metricsRegistry.timer("transactions.duration").record(duration, TimeUnit.MILLISECONDS);
            
            // Log for audit
            auditLog.info("Transaction {} completed in {}ms", txId, duration);
            
            return result;
            
        } catch (Exception e) {
            metricsRegistry.counter("transactions.failure").increment();
            
            // Alert on transaction failures
            if (e instanceof DataIntegrityViolationException) {
                alertService.sendAlert("Data integrity violation in transaction " + txId);
            }
            
            throw e;
        }
    }
}
```

## Best Practices

### 1. Always Use Idempotency Keys
```java
@PostMapping("/payments")
public ResponseEntity<Payment> createPayment(
    @RequestHeader("Idempotency-Key") String idempotencyKey,
    @RequestBody PaymentRequest request
) {
    request.setIdempotencyKey(idempotencyKey);
    return paymentService.processPayment(request);
}
```

### 2. Implement Proper Timeout Handling
```java
@Transactional(timeout = 30) // 30 seconds max
public void processPayment(Payment payment) {
    // Long-running transaction
}
```

### 3. Use Optimistic Locking
```java
@Entity
public class Account {
    @Id
    private String id;
    
    @Version
    private Long version; // Optimistic lock
    
    private BigDecimal balance;
}
```

### 4. Implement Circuit Breakers
```java
@CircuitBreaker(name = "paymentGateway", fallbackMethod = "fallbackPayment")
public PaymentResult processPayment(Payment payment) {
    return paymentGateway.charge(payment);
}

public PaymentResult fallbackPayment(Payment payment, Exception e) {
    // Queue for later processing
    paymentQueue.enqueue(payment);
    return PaymentResult.pending();
}
```

## Conclusion

Implementing ACID transactions in distributed systems requires:
- **Choose the right pattern**: 2PC for strong consistency, Saga for flexibility
- **Embrace eventual consistency** where appropriate
- **Implement idempotency** everywhere
- **Monitor and alert** on transaction failures
- **Test failure scenarios** extensively

For fintech systems, correctness trumps performance. Always err on the side of consistency.

## References

- [Designing Data-Intensive Applications](https://dataintensive.net/)
- [Microservices Patterns: Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [Event Sourcing Pattern](https://martinfowler.com/eaaDev/EventSourcing.html)
