/**
 * Prebuild Script
 *
 * The site intentionally keeps only the API Reference documentation.
 * Do not generate non-API content during production builds.
 */

async function prebuild() {
  console.log('═══════════════════════════════════════════════');
  console.log('🚀 Starting prebuild process...');
  console.log('═══════════════════════════════════════════════\n');

  const startTime = Date.now();
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('API Reference only: no generated guide pages.');
  console.log('═══════════════════════════════════════════════');
  console.log(`✅ Prebuild completed! Duration: ${duration}s`);
  console.log('═══════════════════════════════════════════════\n');
}

// Execute prebuild
prebuild();
