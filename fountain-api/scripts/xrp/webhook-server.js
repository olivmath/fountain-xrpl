/**
 * Webhook Server for Testing
 * Simple Express server to receive webhook notifications from Fountain API
 *
 * Receives webhooks for:
 * - DEPOSIT_PENDING: Temp wallet created, waiting for deposit
 * - DEPOSIT_CONFIRMED: Deposit detected and confirmed
 * - MINTED_TOKENS: Tokens minted and transferred to client wallet
 *
 * Usage:
 *   node webhook-server.js
 *
 * Server runs on http://localhost:4000/webhook by default
 * Use ngrok for external access: ngrok http 4000
 */

const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Store webhook events in memory for inspection
const webhookEvents = [];

// Webhook endpoint
app.post('/webhook', (req, res) => {
  const timestamp = new Date().toISOString();
  const event = {
    timestamp,
    ...req.body,
  };

  webhookEvents.push(event);

  console.log('\n🔔 Webhook Received:');
  console.log('━'.repeat(60));
  console.log(`⏰ Time: ${timestamp}`);
  console.log(`📝 Event Type: ${req.body.eventType || 'UNKNOWN'}`);
  console.log(`🆔 Operation ID: ${req.body.operationId || 'N/A'}`);
  console.log(`📊 Status: ${req.body.status || 'N/A'}`);

  if (req.body.eventType === 'DEPOSIT_PENDING') {
    console.log(`💼 Temp Wallet: ${req.body.tempWalletAddress || 'N/A'}`);
    console.log(`💰 Required Amount: ${req.body.amountRequired || 'N/A'} XRP`);
  }

  if (req.body.eventType === 'DEPOSIT_CONFIRMED') {
    console.log(`✅ Deposited: ${req.body.amountDeposited || 'N/A'} XRP`);
    console.log(`📦 Deposit Count: ${req.body.depositCount || 0}`);
  }

  if (req.body.eventType === 'MINTED_TOKENS') {
    console.log(`🪙 Currency: ${req.body.currencyCode || 'N/A'}`);
    console.log(`💵 Amount Minted: ${req.body.amountMinted || 'N/A'}`);
    console.log(`🏦 Issuer: ${req.body.issuerAddress || 'N/A'}`);
  }

  if (req.body.error) {
    console.log(`❌ Error: ${req.body.error}`);
  }

  console.log('━'.repeat(60));
  console.log(`📋 Total Events Received: ${webhookEvents.length}\n`);

  // Respond with 200 OK
  res.status(200).json({
    received: true,
    timestamp,
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    eventsReceived: webhookEvents.length,
    uptime: process.uptime(),
  });
});

// Get all webhook events
app.get('/events', (req, res) => {
  res.json({
    total: webhookEvents.length,
    events: webhookEvents,
  });
});

// Clear all events
app.delete('/events', (req, res) => {
  const count = webhookEvents.length;
  webhookEvents.length = 0;
  res.json({
    cleared: count,
    message: `Cleared ${count} events`,
  });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('🚀 Webhook Server Started');
  console.log('━'.repeat(60));
  console.log(`📍 Listening on: http://localhost:${PORT}/webhook`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 View events: http://localhost:${PORT}/events`);
  console.log(`🗑️  Clear events: DELETE http://localhost:${PORT}/events`);
  console.log('━'.repeat(60));
  console.log('💡 Tip: Use ngrok for external access:');
  console.log(`   ngrok http ${PORT}`);
  console.log('━'.repeat(60));
  console.log('\n⏳ Waiting for webhooks...\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down webhook server...');
  console.log(`📊 Total events received: ${webhookEvents.length}`);
  process.exit(0);
});
