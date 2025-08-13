const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Backup data from the downloaded backup
const backupData = {
  timestamp: '2025-08-13T06:49:25.918Z',
  size: '88880552',
  tables: {
    backup_metadata: { count: 8, sample: [] },
    backup_status: { count: 1, sample: [] },
    booster_clubs: { count: 22, sample: [] },
    documents: { count: 0, sample: [] },
    form_1099: { count: 12, sample: [] },
    insurance_forms: { count: 2, sample: [] },
    links: { count: 8, sample: [] },
    news: { count: 2, sample: [] },
    officers: { count: 6, sample: [] },
    payment_audit_log: { count: 35, sample: [] },
    test_table: { count: 0, sample: [] },
    users: { count: 2, sample: [] },
    volunteers: { count: 1, sample: [] }
  }
};

async function validateBackupCompleteness() {
  console.log('🔍 Starting comprehensive backup validation...\n');
  
  const validationReport = {
    timestamp: new Date().toISOString(),
    backupTimestamp: backupData.timestamp,
    summary: {
      totalTables: 0,
      tablesWithDifferences: 0,
      tablesWithMissingData: 0,
      tablesWithExtraData: 0,
      criticalIssues: 0
    },
    detailedResults: {},
    recommendations: []
  };

  try {
    // Get all tables from current database
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const currentTables = tablesResult.rows.map(row => row.table_name);
    validationReport.summary.totalTables = currentTables.length;

    console.log(`📊 Found ${currentTables.length} tables in current database`);
    console.log('Tables:', currentTables.join(', '));
    console.log('\n' + '='.repeat(80) + '\n');

    // Validate each table
    for (const tableName of currentTables) {
      console.log(`🔍 Validating table: ${tableName}`);
      
      const tableValidation = await validateTable(tableName);
      validationReport.detailedResults[tableName] = tableValidation;
      
      if (tableValidation.hasDifferences) {
        validationReport.summary.tablesWithDifferences++;
      }
      if (tableValidation.missingData) {
        validationReport.summary.tablesWithMissingData++;
      }
      if (tableValidation.extraData) {
        validationReport.summary.tablesWithExtraData++;
      }
      if (tableValidation.criticalIssues.length > 0) {
        validationReport.summary.criticalIssues += tableValidation.criticalIssues.length;
      }
      
      console.log(`   ✅ Count: ${tableValidation.currentCount} (backup: ${tableValidation.backupCount})`);
      if (tableValidation.hasDifferences) {
        console.log(`   ⚠️  Differences found: ${tableValidation.differences.length}`);
        console.log(`   📝 Missing: ${tableValidation.missingData ? 'Yes' : 'No'}`);
        console.log(`   📝 Extra: ${tableValidation.extraData ? 'Yes' : 'No'}`);
      }
      console.log('');
    }

    // Generate recommendations
    generateRecommendations(validationReport);

    // Save detailed report
    const reportPath = path.join(__dirname, 'backup-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(validationReport, null, 2));
    
    // Save human-readable report
    const humanReportPath = path.join(__dirname, 'backup-validation-report.txt');
    fs.writeFileSync(humanReportPath, generateHumanReadableReport(validationReport));

    console.log('📋 VALIDATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tables: ${validationReport.summary.totalTables}`);
    console.log(`Tables with Differences: ${validationReport.summary.tablesWithDifferences}`);
    console.log(`Tables with Missing Data: ${validationReport.summary.tablesWithMissingData}`);
    console.log(`Tables with Extra Data: ${validationReport.summary.tablesWithExtraData}`);
    console.log(`Critical Issues: ${validationReport.summary.criticalIssues}`);
    console.log('');
    console.log(`📄 Detailed reports saved to:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   Text: ${humanReportPath}`);

    return validationReport;

  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function validateTable(tableName) {
  const result = {
    tableName,
    currentCount: 0,
    backupCount: backupData.tables[tableName]?.count || 0,
    hasDifferences: false,
    missingData: false,
    extraData: false,
    differences: [],
    criticalIssues: [],
    sampleData: [],
    schemaValidation: {}
  };

  try {
    // Get current table count
    const countResult = await pool.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
    result.currentCount = parseInt(countResult.rows[0].count);

    // Check for count differences
    if (result.currentCount !== result.backupCount) {
      result.hasDifferences = true;
      result.differences.push({
        type: 'count_mismatch',
        current: result.currentCount,
        backup: result.backupCount,
        difference: result.currentCount - result.backupCount
      });

      if (result.currentCount < result.backupCount) {
        result.missingData = true;
        result.criticalIssues.push(`Missing ${result.backupCount - result.currentCount} records in ${tableName}`);
      } else {
        result.extraData = true;
      }
    }

    // Get sample data for comparison (first 5 records)
    if (result.currentCount > 0) {
      const sampleResult = await pool.query(`SELECT * FROM "${tableName}" LIMIT 5`);
      result.sampleData = sampleResult.rows;
    }

    // Validate schema
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `, [tableName]);
    
    result.schemaValidation = {
      columnCount: schemaResult.rows.length,
      columns: schemaResult.rows
    };

    // Special validation for critical tables
    if (tableName === 'users' || tableName === 'officers' || tableName === 'booster_clubs') {
      await validateCriticalTable(tableName, result);
    }

  } catch (error) {
    result.criticalIssues.push(`Error validating ${tableName}: ${error.message}`);
  }

  return result;
}

async function validateCriticalTable(tableName, result) {
  try {
    // Check for specific critical data
    if (tableName === 'users') {
      const adminUser = await pool.query(`SELECT * FROM users WHERE username = 'admin'`);
      if (adminUser.rows.length === 0) {
        result.criticalIssues.push('Admin user missing from users table');
      }
    }

    if (tableName === 'booster_clubs') {
      const activeClubs = await pool.query(`SELECT COUNT(*) as count FROM booster_clubs WHERE is_active = true`);
      if (parseInt(activeClubs.rows[0].count) === 0) {
        result.criticalIssues.push('No active booster clubs found');
      }
    }

    if (tableName === 'officers') {
      const ewaOfficers = await pool.query(`SELECT COUNT(*) as count FROM officers WHERE club = 'ewa'`);
      if (parseInt(ewaOfficers.rows[0].count) === 0) {
        result.criticalIssues.push('No EWA officers found');
      }
    }

  } catch (error) {
    result.criticalIssues.push(`Error in critical table validation for ${tableName}: ${error.message}`);
  }
}

function generateRecommendations(report) {
  const recommendations = [];

  if (report.summary.criticalIssues > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      message: 'Critical issues found - backup may not be complete or current database has data loss',
      action: 'Immediate investigation required'
    });
  }

  if (report.summary.tablesWithMissingData > 0) {
    recommendations.push({
      priority: 'HIGH',
      message: `${report.summary.tablesWithMissingData} tables have missing data compared to backup`,
      action: 'Review data loss and consider restoring from backup'
    });
  }

  if (report.summary.tablesWithExtraData > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      message: `${report.summary.tablesWithExtraData} tables have additional data not in backup`,
      action: 'Verify new data is intentional and consider creating new backup'
    });
  }

  if (report.summary.tablesWithDifferences === 0) {
    recommendations.push({
      priority: 'LOW',
      message: 'Backup appears to be complete and current',
      action: 'Backup validation successful - proceed with confidence'
    });
  }

  report.recommendations = recommendations;
}

function generateHumanReadableReport(report) {
  let output = '';
  
  output += 'EWA WEBSITE BACKUP VALIDATION REPORT\n';
  output += '=====================================\n\n';
  output += `Validation Date: ${report.timestamp}\n`;
  output += `Backup Date: ${report.backupTimestamp}\n\n`;
  
  output += 'EXECUTIVE SUMMARY\n';
  output += '=================\n';
  output += `Total Tables Analyzed: ${report.summary.totalTables}\n`;
  output += `Tables with Differences: ${report.summary.tablesWithDifferences}\n`;
  output += `Tables with Missing Data: ${report.summary.tablesWithMissingData}\n`;
  output += `Tables with Extra Data: ${report.summary.tablesWithExtraData}\n`;
  output += `Critical Issues: ${report.summary.criticalIssues}\n\n`;
  
  output += 'DETAILED RESULTS\n';
  output += '================\n\n';
  
  for (const [tableName, result] of Object.entries(report.detailedResults)) {
    output += `Table: ${tableName}\n`;
    output += `  Current Count: ${result.currentCount}\n`;
    output += `  Backup Count: ${result.backupCount}\n`;
    output += `  Status: ${result.hasDifferences ? '⚠️  DIFFERENCES FOUND' : '✅ MATCHES'}\n`;
    
    if (result.hasDifferences) {
      output += `  Issues:\n`;
      result.differences.forEach(diff => {
        output += `    - ${diff.type}: ${diff.difference > 0 ? '+' : ''}${diff.difference} records\n`;
      });
    }
    
    if (result.criticalIssues.length > 0) {
      output += `  Critical Issues:\n`;
      result.criticalIssues.forEach(issue => {
        output += `    - ${issue}\n`;
      });
    }
    
    output += '\n';
  }
  
  output += 'RECOMMENDATIONS\n';
  output += '===============\n';
  report.recommendations.forEach(rec => {
    output += `[${rec.priority}] ${rec.message}\n`;
    output += `    Action: ${rec.action}\n\n`;
  });
  
  return output;
}

// Run validation if called directly
if (require.main === module) {
  validateBackupCompleteness()
    .then(report => {
      console.log('\n✅ Validation completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateBackupCompleteness };
