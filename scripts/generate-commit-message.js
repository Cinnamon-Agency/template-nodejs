#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get git diff
function getGitDiff() {
  try {
    const diff = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    const files = diff.trim().split('\n').filter(Boolean);
    
    let fullDiff = '';
    for (const file of files) {
      try {
        const fileDiff = execSync(`git diff --cached "${file}"`, { encoding: 'utf8' });
        fullDiff += `\n--- ${file} ---\n${fileDiff}\n`;
      } catch (e) {
        // Skip files that can't be diffed
      }
    }
    
    return { files, diff: fullDiff };
  } catch (error) {
    console.error('Error getting git diff:', error.message);
    process.exit(1);
  }
}

// Analyze changes and generate commit message
function generateCommitMessage(files, diff) {
  const changes = {
    feat: [],
    fix: [],
    docs: [],
    style: [],
    refactor: [],
    perf: [],
    test: [],
    chore: [],
    ci: [],
    build: []
  };

  // Analyze file types and patterns
  for (const file of files) {
    if (file.includes('test') || file.includes('spec')) {
      changes.test.push(file);
    } else if (file.includes('doc') || file.includes('readme') || file.includes('.md')) {
      changes.docs.push(file);
    } else if (file.includes('package.json') || file.includes('yarn.lock') || file.includes('npm')) {
      changes.chore.push(file);
    } else if (file.includes('docker') || file.includes('Dockerfile') || file.includes('.yml')) {
      changes.ci.push(file);
    } else if (file.includes('build') || file.includes('webpack') || file.includes('vite')) {
      changes.build.push(file);
    }
  }

  // Analyze diff content for patterns
  const diffLower = diff.toLowerCase();
  
  if (diffLower.includes('fix') || diffLower.includes('bug') || diffLower.includes('error')) {
    changes.fix.push('detected bug fix pattern');
  }
  
  if (diffLower.includes('new') || diffLower.includes('add') || diffLower.includes('create')) {
    changes.feat.push('detected feature addition pattern');
  }
  
  if (diffLower.includes('refactor') || diffLower.includes('extract') || diffLower.includes('simplify')) {
    changes.refactor.push('detected refactor pattern');
  }
  
  if (diffLower.includes('performance') || diffLower.includes('optimize') || diffLower.includes('speed')) {
    changes.perf.push('detected performance improvement pattern');
  }

  // Determine primary type and scope
  let primaryType = 'chore'; // default
  let scope = '';
  
  for (const [type, items] of Object.entries(changes)) {
    if (items.length > 0) {
      primaryType = type;
      break;
    }
  }

  // Determine scope from file paths
  const pathParts = files[0]?.split('/') || [];
  if (pathParts.length > 1) {
    const possibleScopes = ['src', 'api', 'auth', 'db', 'config', 'test', 'docs'];
    scope = possibleScopes.find(s => pathParts.includes(s)) || pathParts[0];
  }

  // Generate description
  let description = '';
  
  if (primaryType === 'feat' && changes.feat.length > 0) {
    description = 'add new feature';
  } else if (primaryType === 'fix' && changes.fix.length > 0) {
    description = 'fix bug';
  } else if (primaryType === 'docs' && changes.docs.length > 0) {
    description = 'update documentation';
  } else if (primaryType === 'test' && changes.test.length > 0) {
    description = 'update tests';
  } else if (primaryType === 'chore' && changes.chore.length > 0) {
    description = 'update dependencies';
  } else if (primaryType === 'refactor' && changes.refactor.length > 0) {
    description = 'refactor code';
  } else if (primaryType === 'perf' && changes.perf.length > 0) {
    description = 'improve performance';
  } else {
    description = 'update files';
  }

  // Construct commit message
  const commitMessage = scope 
    ? `${primaryType}(${scope}): ${description}`
    : `${primaryType}: ${description}`;

  return commitMessage;
}

// Main execution
function main() {
  const { files, diff } = getGitDiff();
  
  if (files.length === 0) {
    console.log('No staged changes found. Please stage your changes first.');
    process.exit(0);
  }

  const commitMessage = generateCommitMessage(files, diff);
  
  console.log('\n🤖 Generated Commit Message:');
  console.log('===========================');
  console.log(commitMessage);
  console.log('===========================');
  
  // Ask for confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\nUse this message? (y/n/edit): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      try {
        execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
        console.log('✅ Commit created successfully!');
      } catch (error) {
        console.error('❌ Error creating commit:', error.message);
      }
    } else if (answer.toLowerCase() === 'e' || answer.toLowerCase() === 'edit') {
      console.log('\nEdit the message:');
      rl.question('> ', (editedMessage) => {
        if (editedMessage.trim()) {
          try {
            execSync(`git commit -m "${editedMessage.trim()}"`, { stdio: 'inherit' });
            console.log('✅ Commit created successfully!');
          } catch (error) {
            console.error('❌ Error creating commit:', error.message);
          }
        }
        rl.close();
      });
    } else {
      console.log('❌ Commit cancelled.');
    }
    rl.close();
  });
}

if (require.main === module) {
  main();
}
