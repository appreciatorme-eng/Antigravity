# GoBuddy n8n Workflows

Automated workflows for GoBuddy Adventures notification system.

## Workflows

### 1. Daily Trip Briefing (`daily-briefing.json`)

Sends morning briefings at 7am to clients with active trips.

**Trigger:** Daily at 7:00 AM
**Actions:**
1. Query active trips (in_progress status, within date range)
2. Get today's driver assignment
3. Get today's accommodation
4. Format briefing message
5. Send push notification to client
6. Generate WhatsApp link for driver notification
7. Log notification in database

## Setup Instructions

### Prerequisites

1. **n8n Instance**: Self-hosted or n8n Cloud
2. **Supabase Database**: Connection credentials
3. **Expo Push**: No API key needed (free tier)

### Installation

1. **Import Workflow**
   - Open n8n
   - Click "Import from file"
   - Select `workflows/daily-briefing.json`

2. **Configure Credentials**

   Create a PostgreSQL credential named `Supabase Database`:
   ```
   Host: db.<your-project>.supabase.co
   Database: postgres
   User: postgres
   Password: <your-db-password>
   Port: 5432
   SSL: Require
   ```

3. **Set Environment Variables** (if using)
   ```
   SUPABASE_DB_HOST=db.xxx.supabase.co
   SUPABASE_DB_PASSWORD=xxx
   API_URL=https://your-app.vercel.app
   ```

4. **Activate Workflow**
   - Toggle the workflow to "Active"
   - Verify the cron expression is correct for your timezone

### Testing

1. **Manual Test**
   - Click "Execute Workflow" to run manually
   - Check notification_logs table for entries

2. **Test Data**
   - Create a trip with status='in_progress'
   - Set start_date <= today <= end_date
   - Add driver assignment for today
   - Run workflow

### Monitoring

- Check workflow execution history in n8n
- Monitor notification_logs table for delivery status
- Set up error notifications in n8n settings

## Workflow Customization

### Change Schedule Time

In the "7am Daily Trigger" node:
```json
"expression": "0 7 * * *"  // Change 7 to desired hour (24h format)
```

### Add Multiple Timezones

For global clients, create separate workflows with different triggers:
- `0 7 * * *` - 7am UTC
- `0 15 * * *` - 7am PST (UTC-8)
- `0 23 * * *` - 7am JST (UTC+9)

### Customize Message Format

Edit the "Format Daily Briefing" Code node to change:
- Message template
- Included information
- Formatting style

## Additional Workflows (Coming Soon)

- **Trip Reminder**: 24h before trip start
- **Pickup Reminder**: 1h before pickup
- **Review Request**: After trip completion
- **Weather Alert**: Severe weather notifications

## Troubleshooting

### No notifications sent

1. Check if trips exist with status='in_progress'
2. Verify date range (start_date <= today <= end_date)
3. Confirm push_tokens exist for client
4. Check n8n execution logs for errors

### Database connection failed

1. Verify Supabase credentials
2. Check SSL configuration
3. Ensure IP is allowed in Supabase settings

### Push notification not received

1. Verify expo_push_token is valid
2. Check Expo push receipt for errors
3. Ensure app has notification permissions
