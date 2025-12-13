# Pattern Validator

Validate your r0astr patterns and configuration files against our JSON schema.

<div id="validator-app" class="validator-container">

## Paste Your Code

<textarea id="code-input" rows="12" placeholder="Paste your pattern or configuration JSON here..."></textarea>

<div class="validator-controls">
  <select id="schema-type">
    <option value="pattern">Pattern (JavaScript)</option>
    <option value="config">Configuration (JSON)</option>
    <option value="skin">Skin Manifest (JSON)</option>
  </select>
  <button id="validate-btn" class="md-button md-button--primary">Validate</button>
</div>

## Results

<div id="validation-results" class="results-container">
  <p class="placeholder">Paste code above and click Validate</p>
</div>

</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const codeInput = document.getElementById('code-input');
  const schemaType = document.getElementById('schema-type');
  const validateBtn = document.getElementById('validate-btn');
  const results = document.getElementById('validation-results');

  // JSON Schemas
  const schemas = {
    config: {
      type: 'object',
      properties: {
        panels: { type: 'array' },
        masterPanel: { type: 'object' },
        settings: { type: 'object' }
      }
    },
    skin: {
      type: 'object',
      required: ['name', 'version'],
      properties: {
        name: { type: 'string', minLength: 1 },
        version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
        author: { type: 'string' },
        description: { type: 'string' },
        preview: { type: 'string' },
        compatibility: { type: 'string' }
      }
    }
  };

  validateBtn.addEventListener('click', function() {
    const code = codeInput.value.trim();
    const type = schemaType.value;

    if (!code) {
      showResult('error', 'Please paste some code to validate.');
      return;
    }

    if (type === 'pattern') {
      validatePattern(code);
    } else {
      validateJSON(code, type);
    }
  });

  function validatePattern(code) {
    try {
      // Basic JavaScript syntax check using Function constructor
      new Function(code);
      showResult('success', 'JavaScript syntax is valid.');
    } catch (e) {
      showResult('error', `Syntax Error: ${e.message}`);
    }
  }

  function validateJSON(code, type) {
    try {
      const parsed = JSON.parse(code);
      const schema = schemas[type];
      const errors = validateAgainstSchema(parsed, schema);

      if (errors.length === 0) {
        showResult('success', `Valid ${type} configuration.`);
      } else {
        showResult('error', 'Validation errors:\n' + errors.join('\n'));
      }
    } catch (e) {
      showResult('error', `JSON Parse Error: ${e.message}`);
    }
  }

  function validateAgainstSchema(obj, schema, path = '') {
    const errors = [];

    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in obj)) {
          errors.push(`Missing required field: ${path}${field}`);
        }
      }
    }

    // Check properties
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in obj) {
          const value = obj[key];
          const propPath = path ? `${path}.${key}` : key;

          // Type check
          if (propSchema.type) {
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (actualType !== propSchema.type) {
              errors.push(`${propPath}: expected ${propSchema.type}, got ${actualType}`);
            }
          }

          // Pattern check
          if (propSchema.pattern && typeof value === 'string') {
            const regex = new RegExp(propSchema.pattern);
            if (!regex.test(value)) {
              errors.push(`${propPath}: does not match pattern ${propSchema.pattern}`);
            }
          }

          // MinLength check
          if (propSchema.minLength && typeof value === 'string') {
            if (value.length < propSchema.minLength) {
              errors.push(`${propPath}: must be at least ${propSchema.minLength} characters`);
            }
          }
        }
      }
    }

    return errors;
  }

  function showResult(type, message) {
    results.innerHTML = `<div class="result result-${type}"><pre>${escapeHtml(message)}</pre></div>`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
</script>

<style>
.validator-container {
  margin: 2rem 0;
}

#code-input {
  width: 100%;
  font-family: monospace;
  font-size: 14px;
  padding: 1rem;
  border: 1px solid var(--md-default-fg-color--lighter);
  border-radius: 4px;
  background: var(--md-code-bg-color);
  color: var(--md-code-fg-color);
  resize: vertical;
}

.validator-controls {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  align-items: center;
}

#schema-type {
  padding: 0.5rem 1rem;
  font-size: 14px;
  border-radius: 4px;
}

.results-container {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 4px;
  background: var(--md-code-bg-color);
  min-height: 100px;
}

.result pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.result-success {
  border-left: 4px solid #4caf50;
  padding-left: 1rem;
}

.result-error {
  border-left: 4px solid #f44336;
  padding-left: 1rem;
}

.placeholder {
  color: var(--md-default-fg-color--lighter);
  font-style: italic;
}
</style>

---

## Schema Reference

### Pattern Validation

Validates JavaScript syntax only. Does not check Strudel-specific semantics.

### Configuration Schema

```json
{
  "panels": [...],
  "masterPanel": {...},
  "settings": {...}
}
```

### Skin Manifest Schema

```json
{
  "name": "string (required)",
  "version": "X.Y.Z (required)",
  "author": "string",
  "description": "string",
  "preview": "filename.png",
  "compatibility": "r0astr version"
}
```

---

*For pattern syntax help, see [Pattern Syntax](../learn/patterns.md).*
