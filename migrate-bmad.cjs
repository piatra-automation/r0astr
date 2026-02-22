#!/usr/bin/env node
/**
 * migrate-bmad.js
 *
 * Converts BMAD epic/story structure to Automaker feature format.
 * Reads from bmad/prd and bmad/stories, writes to .automaker/features/
 */

const fs = require('fs');
const path = require('path');

// Epic to category mapping
const EPIC_CATEGORIES = {
  '1': 'Dynamic Panel Management',
  '2': 'Enhanced Panel UI',
  '3': 'Splash/Hero Screen',
  '4': 'Settings System',
  '5': 'Server Endpoints',
  '6': 'Staleness Detection',
  '7': 'Text Panel Improvements',
  '8': 'Remote Control Synchronization',
  '9': 'Code Architecture Refactor',
  '10': 'UI Module Extraction'
};

// Status mapping from BMAD to Automaker
const STATUS_MAP = {
  'Done': 'completed',
  'DOne': 'completed',
  'DONE': 'completed',
  'Complete': 'completed',
  'Ready for Review': 'completed',
  'In Progress': 'in_progress',
  'Ready for Development': 'backlog',
  'Draft': 'backlog',
  'Blocked - Unblocked by Epic 10 (Stories 10.1-10.4)': 'backlog'
};

// Complexity estimation based on story content
function estimateComplexity(content) {
  const acCount = (content.match(/^###? (?:AC|Acceptance Criteria)/gm) || []).length;
  const taskCount = (content.match(/^- \[.\]/gm) || []).length;

  if (taskCount > 15 || acCount > 8) return 'complex';
  if (taskCount > 5 || acCount > 3) return 'medium';
  return 'simple';
}

// Extract description from story
function extractDescription(content) {
  // Extract "As a... I want... so that..." user story
  const userStoryMatch = content.match(/\*\*As a\*\*(.+?)\*\*I want\*\*(.+?)\*\*so that\*\*(.+?)(?:\n\n|\n#)/s);
  if (userStoryMatch) {
    const asA = userStoryMatch[1].trim();
    const iWant = userStoryMatch[2].trim();
    const soThat = userStoryMatch[3].trim();
    return `${iWant.replace(/,$/, '')}. ${soThat}`;
  }

  // Fallback: extract first paragraph after "## Story"
  const storyMatch = content.match(/## Story\s*\n\n(.+?)(?:\n\n|\n#)/s);
  if (storyMatch) {
    return storyMatch[1].trim().replace(/\n/g, ' ');
  }

  return 'Implement feature from BMAD story';
}

// Parse dependencies from story content
function extractDependencies(content, epicNum, storyNum) {
  const deps = [];

  // Check for "Dependencies:" section
  const depsMatch = content.match(/##? Dependencies\s*\n\n(.+?)(?:\n\n|\n#)/s);
  if (depsMatch) {
    const depsText = depsMatch[1];
    // Extract story references like "Story 1.2" or "Epic 2"
    const storyRefs = depsText.matchAll(/(?:Story|Epic)\s+(\d+)(?:\.(\d+))?/g);
    for (const match of storyRefs) {
      const depEpic = match[1];
      const depStory = match[2];
      if (depStory) {
        deps.push(`epic-${depEpic}-story-${depStory}`);
      }
    }
  }

  // Logical dependencies (e.g., Story 1.2 depends on 1.1)
  if (epicNum && storyNum && parseInt(storyNum) > 1) {
    deps.push(`epic-${epicNum}-story-${parseInt(storyNum) - 1}`);
  }

  return [...new Set(deps)]; // Deduplicate
}

// Main conversion function
function convertStoriesToFeatures() {
  const epicsDir = 'bmad/prd';
  const storiesDir = 'bmad/stories';
  const featuresDir = '.automaker/features';

  const conversionLog = [];

  // Ensure features directory exists
  if (!fs.existsSync(featuresDir)) {
    fs.mkdirSync(featuresDir, { recursive: true });
  }

  // Read all story files
  const storyFiles = fs.readdirSync(storiesDir).filter(f => f.endsWith('.md'));

  for (const file of storyFiles) {
    const storyMatch = file.match(/^(\d+)\.(\d+)\.(.+)\.md$/);
    if (!storyMatch) continue;

    const epicNum = storyMatch[1];
    const storyNum = storyMatch[2];
    const storySlug = storyMatch[3];

    const filePath = path.join(storiesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract metadata
    const titleMatch = content.match(/^# Story .+?: (.+)$/m);
    const title = titleMatch ? titleMatch[1] : storySlug.replace(/-/g, ' ');

    const statusMatch = content.match(/^## Status\s*\n(.+)$/m);
    const bmadStatus = statusMatch ? statusMatch[1].trim() : 'Ready for Development';
    const automakerStatus = STATUS_MAP[bmadStatus] || 'backlog';

    const category = EPIC_CATEGORIES[epicNum] || 'Uncategorized';
    const description = extractDescription(content);
    const complexity = estimateComplexity(content);
    const dependencies = extractDependencies(content, epicNum, storyNum);

    // Determine priority based on epic number (earlier epics = higher priority)
    const priority = parseInt(epicNum);

    // Create feature ID
    const featureId = `epic-${epicNum}-story-${storyNum}-${storySlug}`;

    // Create feature object
    const feature = {
      id: featureId,
      category: category,
      title: title,
      description: description,
      status: automakerStatus,
      priority: priority,
      complexity: complexity,
      dependencies: dependencies,
      metadata: {
        bmadEpic: epicNum,
        bmadStory: storyNum,
        bmadStatus: bmadStatus,
        bmadFile: file
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Write feature file
    const featureDir = path.join(featuresDir, featureId);
    if (!fs.existsSync(featureDir)) {
      fs.mkdirSync(featureDir, { recursive: true });
    }

    const featureFile = path.join(featureDir, 'feature.json');
    fs.writeFileSync(featureFile, JSON.stringify(feature, null, 2));

    conversionLog.push({
      bmad: file,
      automaker: featureId,
      status: automakerStatus,
      category: category
    });
  }

  // Write conversion log
  fs.writeFileSync(
    '.automaker/bmad-migration-log.json',
    JSON.stringify(conversionLog, null, 2)
  );

  console.log(`✅ Converted ${conversionLog.length} BMAD stories to Automaker features`);
  console.log(`📊 Status breakdown:`);

  const statusCounts = {};
  conversionLog.forEach(item => {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
  });

  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });

  return conversionLog;
}

// Run conversion
if (require.main === module) {
  try {
    convertStoriesToFeatures();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

module.exports = { convertStoriesToFeatures };
