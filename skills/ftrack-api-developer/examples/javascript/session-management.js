/**
 * ftrack JavaScript API - Session Management Examples
 *
 * Demonstrates various patterns for managing ftrack API sessions
 * in both browser and Node.js environments.
 */

import ftrack from '@ftrack/api';

// ============================================================================
// Basic Session Initialization
// ============================================================================

/**
 * Create a basic session with credentials
 */
async function createBasicSession() {
  const session = new ftrack.Session(
    process.env.FTRACK_SERVER || "https://company.ftrackapp.com",
    process.env.FTRACK_API_USER || "user@example.com",
    process.env.FTRACK_API_KEY || "your-api-key"
  );

  // Wait for session to initialize
  await session.initializing;

  console.log('Session initialized successfully');

  // Always close session when done
  session.close();
}

// ============================================================================
// Session with Error Handling
// ============================================================================

/**
 * Create session with proper error handling
 */
async function createSessionWithErrorHandling() {
  let session;

  try {
    session = new ftrack.Session(
      process.env.FTRACK_SERVER,
      process.env.FTRACK_API_USER,
      process.env.FTRACK_API_KEY
    );

    await session.initializing;

    // Verify connection
    const serverInfo = await session.getServerInformation();
    console.log(`Connected to ftrack ${serverInfo.version}`);

    return session;

  } catch (error) {
    console.error('Failed to initialize session:', error);
    if (session) {
      session.close();
    }
    throw error;
  }
}

// ============================================================================
// Session Manager Class (Recommended Pattern)
// ============================================================================

/**
 * Reusable session manager with connection pooling
 */
class FtrackSessionManager {
  constructor(config) {
    this.config = {
      server: config.server || process.env.FTRACK_SERVER,
      user: config.user || process.env.FTRACK_API_USER,
      apiKey: config.apiKey || process.env.FTRACK_API_KEY,
      autoConnect: config.autoConnect !== false,
      timeout: config.timeout || 30000
    };

    this.session = null;
    this.isConnected = false;
  }

  /**
   * Get or create session
   */
  async getSession() {
    if (this.session && this.isConnected) {
      return this.session;
    }

    return await this.connect();
  }

  /**
   * Connect to ftrack
   */
  async connect() {
    if (this.isConnected) {
      return this.session;
    }

    try {
      this.session = new ftrack.Session(
        this.config.server,
        this.config.user,
        this.config.apiKey
      );

      await Promise.race([
        this.session.initializing,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), this.config.timeout)
        )
      ]);

      this.isConnected = true;
      console.log('✓ Connected to ftrack');

      return this.session;

    } catch (error) {
      console.error('✗ Connection failed:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.session) {
      this.session.close();
      this.session = null;
      this.isConnected = false;
      console.log('✓ Disconnected from ftrack');
    }
  }

  /**
   * Execute operation with automatic cleanup
   */
  async withSession(operation) {
    const session = await this.getSession();

    try {
      return await operation(session);
    } catch (error) {
      console.error('Operation failed:', error);
      throw error;
    }
  }
}

// ============================================================================
// Browser-Specific Session
// ============================================================================

/**
 * Create session in browser environment
 * Note: Requires CORS configuration on ftrack server
 */
async function createBrowserSession() {
  // In browser, credentials typically come from user input or stored config
  const session = new ftrack.Session(
    window.FTRACK_CONFIG.server,
    window.FTRACK_CONFIG.user,
    window.FTRACK_CONFIG.apiKey
  );

  await session.initializing;

  // Store session for later use
  window.ftrackSession = session;

  return session;
}

// ============================================================================
// Session Configuration Options
// ============================================================================

/**
 * Advanced session configuration
 */
async function createConfiguredSession() {
  const session = new ftrack.Session(
    process.env.FTRACK_SERVER,
    process.env.FTRACK_API_USER,
    process.env.FTRACK_API_KEY,
    {
      // Optional configuration
      autoConnectEventHub: false,  // Disable event hub if not needed
      serverInformationValues: {},
      clientToken: null
    }
  );

  await session.initializing;

  return session;
}

// ============================================================================
// Usage Examples
// ============================================================================

async function main() {
  // Example 1: Basic usage
  console.log('\n=== Example 1: Basic Session ===');
  await createBasicSession();

  // Example 2: Session manager (recommended)
  console.log('\n=== Example 2: Session Manager ===');
  const manager = new FtrackSessionManager({
    server: process.env.FTRACK_SERVER,
    user: process.env.FTRACK_API_USER,
    apiKey: process.env.FTRACK_API_KEY
  });

  await manager.withSession(async (session) => {
    const projects = await session.query('select name from Project limit 3');
    console.log(`Found ${projects.data.length} projects`);
  });

  manager.disconnect();

  // Example 3: Multiple operations with same session
  console.log('\n=== Example 3: Reuse Session ===');
  const session = await createSessionWithErrorHandling();

  try {
    // Operation 1
    const users = await session.query('select username from User limit 5');
    console.log(`Users: ${users.data.length}`);

    // Operation 2
    const statuses = await session.query('select name from Status');
    console.log(`Statuses: ${statuses.data.length}`);

  } finally {
    session.close();
  }
}

// ============================================================================
// Export for use in other modules
// ============================================================================

export {
  createBasicSession,
  createSessionWithErrorHandling,
  createBrowserSession,
  FtrackSessionManager
};

// Run examples if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
