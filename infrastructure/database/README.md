# Lehman Brothers V2 Database

## Configuration

This PostgreSQL database is configured to work with Docker.

### Start the database

```bash
# Start services
docker-compose up -d

# Check that containers are running
docker-compose ps
```

### Database access

- **PostgreSQL**: `localhost:5432`
- **Database**: `lehman_brothers`
- **User**: `lehman_user`
- **Password**: `lehman_password`

### Administration interface

- **Adminer**: http://localhost:8080
  - System: PostgreSQL
  - Server: postgres
  - User: lehman_user
  - Password: lehman_password
  - Database: lehman_brothers

### Stop services

```bash
# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v
```

## Database structure

### Main tables

1. **users** - System users (clients, directors, advisors)
2. **accounts** - Bank accounts (current and savings)
3. **savings_rates** - Historical savings rates
4. **transactions** - Transactions between accounts
5. **stocks** - Stocks available for buy/sell
6. **orders** - Buy/sell stock orders
7. **loans** - Loans granted to clients
8. **installments** - Loan repayment installments
9. **chats** - Conversations between clients and advisors
10. **messages** - Messages in conversations

### Enumerated types

- `user_role`: CLIENT, DIRECTOR, ADVISOR
- `transaction_type`: DEBIT, CREDIT
- `order_type`: BUY, SELL
- `order_status`: PENDING, EXECUTED, CANCELED

## Initialization scripts

- `01-create-schema.sql`: Create schema and tables
- `02-insert-sample-data.sql`: Insert sample data