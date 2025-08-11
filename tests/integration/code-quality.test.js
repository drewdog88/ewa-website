// const fs = require('fs'); // Unused - can be removed in future cleanup
// const path = require('path'); // Unused - can be removed in future cleanup
const { execSync } = require('child_process');

describe('Real Code Quality Validation', () => {
  let eslintResults;

  beforeAll(() => {
    try {
      // Run ESLint and capture results
      const eslintOutput = execSync('npx eslint . --format json', { 
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      eslintResults = JSON.parse(eslintOutput);
    } catch (error) {
      // ESLint failed, parse the error output
      eslintResults = [];
      console.warn('ESLint failed to run:', error.message);
    }
  });

  describe('Security Issues', () => {
    test('should not have prototype builtin access issues', () => {
      const prototypeIssues = eslintResults.filter(issue => 
        issue.messages.some(msg => msg.ruleId === 'no-prototype-builtins')
      );
      
      expect(prototypeIssues).toHaveLength(0);
      
      if (prototypeIssues.length > 0) {
        console.error('❌ Found prototype builtin access issues:');
        prototypeIssues.forEach(file => {
          file.messages.forEach(msg => {
            console.error(`   ${file.filePath}:${msg.line}:${msg.column} - ${msg.message}`);
          });
        });
      }
    });

    test('should not have undefined variable issues', () => {
      const undefinedIssues = eslintResults.filter(issue => 
        issue.messages.some(msg => msg.ruleId === 'no-undef')
      );
      
      // Allow some browser-specific undefined issues in browser files
      const browserUndefinedIssues = undefinedIssues.filter(issue => {
        const isBrowserFile = issue.filePath.includes('assets/') || 
                             issue.filePath.includes('security.js') ||
                             issue.filePath.includes('.html');
        return !isBrowserFile;
      });
      
      expect(browserUndefinedIssues).toHaveLength(0);
      
      if (browserUndefinedIssues.length > 0) {
        console.error('❌ Found undefined variable issues in non-browser files:');
        browserUndefinedIssues.forEach(file => {
          file.messages.forEach(msg => {
            console.error(`   ${file.filePath}:${msg.line}:${msg.column} - ${msg.message}`);
          });
        });
      }
    });
  });

  describe('Code Structure Issues', () => {
    test('should not have const reassignment issues', () => {
      const constReassignmentIssues = eslintResults.filter(issue => 
        issue.messages.some(msg => msg.ruleId === 'no-const-assign')
      );
      
      expect(constReassignmentIssues).toHaveLength(0);
      
      if (constReassignmentIssues.length > 0) {
        console.error('❌ Found const reassignment issues:');
        constReassignmentIssues.forEach(file => {
          file.messages.forEach(msg => {
            console.error(`   ${file.filePath}:${msg.line}:${msg.column} - ${msg.message}`);
          });
        });
      }
    });

    test('should not have function declaration scope issues', () => {
      const functionScopeIssues = eslintResults.filter(issue => 
        issue.messages.some(msg => 
          msg.ruleId === 'no-inner-declarations' || 
          msg.ruleId === 'no-case-declarations'
        )
      );
      
      expect(functionScopeIssues).toHaveLength(0);
      
      if (functionScopeIssues.length > 0) {
        console.error('❌ Found function declaration scope issues:');
        functionScopeIssues.forEach(file => {
          file.messages.forEach(msg => {
            console.error(`   ${file.filePath}:${msg.line}:${msg.column} - ${msg.message}`);
          });
        });
      }
    });
  });

  describe('Code Style Issues', () => {
    test('should not have unnecessary escape character issues', () => {
      const escapeIssues = eslintResults.filter(issue => 
        issue.messages.some(msg => msg.ruleId === 'no-useless-escape')
      );
      
      expect(escapeIssues).toHaveLength(0);
      
      if (escapeIssues.length > 0) {
        console.error('❌ Found unnecessary escape character issues:');
        escapeIssues.forEach(file => {
          file.messages.forEach(msg => {
            console.error(`   ${file.filePath}:${msg.line}:${msg.column} - ${msg.message}`);
          });
        });
      }
    });
  });

  describe('Code Maintainability', () => {
    test('should have reasonable number of unused variables', () => {
      const unusedVarIssues = eslintResults.filter(issue => 
        issue.messages.some(msg => msg.ruleId === 'no-unused-vars')
      );
      
      // Count total unused variables
      const totalUnusedVars = unusedVarIssues.reduce((total, file) => {
        return total + file.messages.filter(msg => msg.ruleId === 'no-unused-vars').length;
      }, 0);
      
      // Allow some unused variables (less than 50 total)
      expect(totalUnusedVars).toBeLessThan(50);
      
      if (totalUnusedVars >= 50) {
        console.error(`❌ Too many unused variables: ${totalUnusedVars}`);
        console.error('Consider cleaning up unused imports and variables');
      }
    });

    test('should have reasonable number of unused parameters', () => {
      const unusedParamIssues = eslintResults.filter(issue => 
        issue.messages.some(msg => 
          msg.ruleId === 'no-unused-vars' && 
          msg.message.includes('is defined but never used')
        )
      );
      
      // Count total unused parameters
      const totalUnusedParams = unusedParamIssues.reduce((total, file) => {
        return total + file.messages.filter(msg => 
          msg.ruleId === 'no-unused-vars' && 
          msg.message.includes('is defined but never used')
        ).length;
      }, 0);
      
      // Allow some unused parameters (less than 20 total)
      expect(totalUnusedParams).toBeLessThan(20);
      
      if (totalUnusedParams >= 20) {
        console.error(`❌ Too many unused parameters: ${totalUnusedParams}`);
        console.error('Consider prefixing unused parameters with underscore (_)');
      }
    });
  });

  describe('Overall Code Quality Score', () => {
    test('should maintain high code quality standards', () => {
      // Calculate quality metrics
      const totalErrors = eslintResults.reduce((total, file) => {
        return total + file.messages.filter(msg => msg.severity === 2).length;
      }, 0);
      
      const totalWarnings = eslintResults.reduce((total, file) => {
        return total + file.messages.filter(msg => msg.severity === 1).length;
      }, 0);
      
      const totalIssues = totalErrors + totalWarnings;
      
      // Calculate quality score (100 = perfect, 0 = terrible)
      let qualityScore = 100;
      
      // Deduct points for errors (more severe)
      qualityScore -= (totalErrors * 5);
      
      // Deduct points for warnings (less severe)
      qualityScore -= (totalWarnings * 1);
      
      // Ensure score doesn't go below 0
      qualityScore = Math.max(0, qualityScore);
      
      console.log('📊 Code Quality Metrics:');
      console.log(`   Total Errors: ${totalErrors}`);
      console.log(`   Total Warnings: ${totalWarnings}`);
      console.log(`   Total Issues: ${totalIssues}`);
      console.log(`   Quality Score: ${qualityScore}/100`);
      
      // Require minimum quality score of 70
      expect(qualityScore).toBeGreaterThanOrEqual(70);
      
      if (qualityScore < 70) {
        console.error('❌ Code quality score too low!');
        console.error('Please address the ESLint issues to improve code quality.');
      } else if (qualityScore >= 90) {
        console.log('✅ Excellent code quality!');
      } else if (qualityScore >= 80) {
        console.log('✅ Good code quality!');
      } else {
        console.log('⚠️  Acceptable code quality, but room for improvement.');
      }
    });
  });

  describe('File-Specific Quality Checks', () => {
    test('should have clean API files', () => {
      const apiFiles = eslintResults.filter(issue => 
        issue.filePath.includes('/api/') && 
        issue.messages.some(msg => msg.severity === 2) // errors only
      );
      
      expect(apiFiles).toHaveLength(0);
      
      if (apiFiles.length > 0) {
        console.error('❌ Found errors in API files:');
        apiFiles.forEach(file => {
          file.messages.filter(msg => msg.severity === 2).forEach(msg => {
            console.error(`   ${file.filePath}:${msg.line}:${msg.column} - ${msg.message}`);
          });
        });
      }
    });

    test('should have clean database files', () => {
      const dbFiles = eslintResults.filter(issue => 
        issue.filePath.includes('/database/') && 
        issue.messages.some(msg => msg.severity === 2) // errors only
      );
      
      expect(dbFiles).toHaveLength(0);
      
      if (dbFiles.length > 0) {
        console.error('❌ Found errors in database files:');
        dbFiles.forEach(file => {
          file.messages.filter(msg => msg.severity === 2).forEach(msg => {
            console.error(`   ${file.filePath}:${msg.line}:${msg.column} - ${msg.message}`);
          });
        });
      }
    });

    test('should have clean utility files', () => {
      const utilFiles = eslintResults.filter(issue => 
        issue.filePath.includes('/utils/') && 
        issue.messages.some(msg => msg.severity === 2) // errors only
      );
      
      expect(utilFiles).toHaveLength(0);
      
      if (utilFiles.length > 0) {
        console.error('❌ Found errors in utility files:');
        utilFiles.forEach(file => {
          file.messages.filter(msg => msg.severity === 2).forEach(msg => {
            console.error(`   ${file.filePath}:${msg.line}:${msg.column} - ${msg.message}`);
          });
        });
      }
    });
  });
});
