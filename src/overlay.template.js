(() => {
  const CURRENT_PATCH_VERSION = __PATCH_VERSION__;
  if (
    window.__antigravityZhPatchInstalled === CURRENT_PATCH_VERSION &&
    window.__antigravityZhPatchObserver &&
    document.documentElement.lang === 'zh-CN'
  ) {
    return;
  }
  if (window.__antigravityZhPatchObserver) {
    try { window.__antigravityZhPatchObserver.disconnect(); } catch {}
    window.__antigravityZhPatchObserver = null;
  }
  if (window.__antigravityTitleInterval) {
    try { clearInterval(window.__antigravityTitleInterval); } catch {}
    window.__antigravityTitleInterval = null;
  }
  if (window.__antigravityIdleInterval) {
    try { clearInterval(window.__antigravityIdleInterval); } catch {}
    window.__antigravityIdleInterval = null;
  }
  if (window.__antigravityHoverCleanup) {
    try { window.__antigravityHoverCleanup(); } catch {}
    window.__antigravityHoverCleanup = null;
  }
  window.__antigravityZhPatchInstalled = CURRENT_PATCH_VERSION;

  // ========== 1. Unified Super-Dictionary (v2.26.0, 4,960+ Exact + 338 Cascading Regexes) ==========
  const RAW_DICT = __RAW_DICT__;
  const RAW_PATTERNS = __RAW_PATTERNS__;

  const exactMap = new Map(Object.entries(RAW_DICT));
  const lowerMap = new Map();
  const translatedValuesSet = new Set();
  for (const [k, v] of exactMap.entries()) {
    const lk = k.toLowerCase();
    if (!lowerMap.has(lk)) lowerMap.set(lk, v);
    translatedValuesSet.add(v);
  }

  const compiledPatterns = [];
  for (let i = 0; i < RAW_PATTERNS.length; i++) {
    try {
      const p = RAW_PATTERNS[i];
      compiledPatterns.push({
        regex: new RegExp(p.regex),
        replacement: p.replacement
      });
    } catch {}
  }

  // LRU-like translation cache for O(1) repeated lookups
  const translationCache = new Map();
  const MAX_CACHE_SIZE = 12000;
  function cacheSet(key, val) {
    if (translationCache.size >= MAX_CACHE_SIZE) {
      const iter = translationCache.keys();
      for (let i = 0; i < 1500; i++) {
        const k = iter.next().value;
        if (k !== undefined) translationCache.delete(k);
        else break;
      }
    }
    translationCache.set(key, val);
    return val;
  }

  function norm(s) {
    if (!s) return '';
    return s.replace(/\s+/g, ' ')
            .replace(/[‘’]/g, "'")
            .replace(/[“”]/g, '"')
            .replace(/…/g, '...')
            .trim();
  }

  // ========== 2. Strict Physical Isolation (Inputs / Active Focus / Code / Chat Prose / Model Specs) ==========
  const SKIP_TEXT_SELECTOR = [
    // Editable inputs & rich-text editors (Lexical / contenteditable / native inputs)
    'input', 'textarea', 'select', 'option',
    '[contenteditable="true"]', '[contenteditable="plaintext-only"]', '[contenteditable=""]',
    '[data-lexical-editor]',
    '[role="textbox"]', '[role="combobox"]', '[role="searchbox"]',
    // Model selector internal specs (keep model names & effort badges pure English to prevent React DOM clash)
    '[data-testid="model-selector-trigger"]',
    '[data-testid="model-selector-item"]',
    '[data-testid="model-selector-effort-option"]',
    '[data-testid="model-selector-effort-group"]',
    '[data-testid="model-selector-list"]',
    '[data-effort]',
    // User sent messages, AI markdown responses, and expanded thinking prose
    '[data-testid="user-input-step"] [data-quotable="true"]',
    '[data-testid="planner-response-text"]',
    '.cursor-edit',
    // Code blocks, terminals, editors, file viewers, diffs, syntax tokens, file/entity pills
    'script', 'style', 'code', 'pre', 'kbd', 'samp', 'var', 'noscript', 'svg', 'path', 'canvas',
    '.xterm', '.terminal', '.monaco-editor', '.view-lines', '.view-line', '.cm-editor', '.cm-line',
    '.code-line', '.code-block', '.line-content',
    '[aria-label="File Viewer"]', '[data-file-uri]', '[data-uri]',
    '[class*="diffEditor"]', '.token', '.hljs', '[class*="mtk"]',
    '.font-mono', '[data-quotable-inline="true"]', '.context-scope-mention',
    '[data-testid="file-title-name"]', '[data-testid="entity-pill"]',
    // Sidebar project names & conversation titles
    '[data-project-card="true"]',
    '[data-testid="conversation-row-sidebar"] span.truncate',
    '[translate="no"]', '.notranslate'
  ].join(', ');

  const SKIP_ATTR_SELECTOR = [
    '[contenteditable="true"]', '[contenteditable="plaintext-only"]', '[contenteditable=""]',
    '[data-lexical-editor]',
    '[data-testid="model-selector-trigger"]',
    '[data-testid="model-selector-item"]',
    '[data-testid="model-selector-list"]',
    '[data-testid="user-input-step"] [data-quotable="true"]',
    '[data-testid="planner-response-text"]',
    '.cursor-edit',
    'script', 'style', 'code', 'pre',
    '.xterm', '.terminal', '.monaco-editor', '.cm-editor', '.cm-line',
    '[aria-label="File Viewer"]', '[data-file-uri]', '[data-uri]',
    '[class*="diffEditor"]', '.token', '.hljs', '[class*="mtk"]',
    '.font-mono', '[data-quotable-inline="true"]', '.context-scope-mention',
    '[data-testid="file-title-name"]', '[data-testid="entity-pill"]',
    '[data-project-card="true"]',
    '[data-testid="conversation-row-sidebar"]',
    '[translate="no"]', '.notranslate'
  ].join(', ');

  function isModelSelectorBoundary(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    const tid = el.getAttribute?.('data-testid');
    if (
      tid === 'model-selector-trigger' ||
      tid === 'model-selector-item' ||
      tid === 'model-selector-effort-option' ||
      tid === 'model-selector-effort-group' ||
      tid === 'model-selector-list'
    ) {
      return true;
    }
    if (el.hasAttribute?.('data-effort')) return true;
    return false;
  }

  function isEditableElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    if (el.isContentEditable) return true;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'OPTION') return true;
    const ce = el.getAttribute?.('contenteditable');
    if (ce === 'true' || ce === 'plaintext-only' || ce === '') return true;
    if (el.getAttribute?.('data-lexical-editor') === 'true') return true;
    const role = el.getAttribute?.('role');
    if (role === 'textbox' || role === 'combobox' || role === 'searchbox') return true;
    return false;
  }

  function shouldSkipText(node) {
    try {
      if (!node) return true;
      let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
      if (!el) return true;
      if (isEditableElement(el) || isModelSelectorBoundary(el)) return true;
      const active = document.activeElement;
      if (active && isEditableElement(active) && (active === el || active.contains(el))) {
        return true;
      }
      while (el) {
        if (isEditableElement(el) || isModelSelectorBoundary(el)) return true;
        if (typeof el.closest === 'function' && el.closest(SKIP_TEXT_SELECTOR)) return true;
        const root = typeof el.getRootNode === 'function' ? el.getRootNode() : null;
        el = (root && root.host) ? root.host : null;
      }
      return false;
    } catch {
      return true;
    }
  }

  function shouldSkipAttrs(element) {
    try {
      if (!element || element.nodeType !== Node.ELEMENT_NODE) return true;
      if (element.isContentEditable || isModelSelectorBoundary(element)) return true;
      const active = document.activeElement;
      if (active && (active === element || element.contains(active)) && isEditableElement(active)) {
        return true;
      }
      let el = element;
      while (el) {
        if (el.isContentEditable || isModelSelectorBoundary(el)) return true;
        if (typeof el.closest === 'function' && el.closest(SKIP_ATTR_SELECTOR)) return true;
        const root = typeof el.getRootNode === 'function' ? el.getRootNode() : null;
        el = (root && root.host) ? root.host : null;
      }
      return false;
    } catch {
      return true;
    }
  }

  // ========== 3. Core String Translation Engine (O(1) Dict + 338 Cascading Regexes + Dynamic Rules) ==========
  function formatDuration(raw) {
    let text = raw.trim();
    const parts = [];
    const dayMatch = text.match(/(\d+)\s*days?/i);
    const hourMatch = text.match(/(\d+)\s*hours?/i);
    const minMatch = text.match(/(\d+)\s*minutes?/i);
    const secMatch = text.match(/(\d+)\s*seconds?/i);
    if (dayMatch) parts.push(dayMatch[1] + ' 天');
    if (hourMatch) parts.push(hourMatch[1] + ' 小时');
    if (minMatch) parts.push(minMatch[1] + ' 分钟');
    if (secMatch) parts.push(secMatch[1] + ' 秒');
    if (parts.length > 0) return parts.join(' ');
    if (/less than a minute/i.test(text)) return '不到 1 分钟';
    if (/a few seconds/i.test(text)) return '几秒';
    return text;
  }

  function formatCompactDuration(raw) {
    let s = raw.trim();
    if (s === '<1s' || s === '< 1s') return '不到 1 秒';
    return s
      .replace(/(\d+(?:\.\d+)?)\s*h(?:ours?|r)?/gi, '$1 小时')
      .replace(/(\d+(?:\.\d+)?)\s*m(?:inutes?|in)?/gi, '$1 分钟')
      .replace(/(\d+(?:\.\d+)?)\s*s(?:econds?|ec)?/gi, '$1 秒')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const STEP_VERB_MAP = {
    exploring: '正在探索',
    explored: '已探索',
    editing: '正在编辑',
    edited: '已编辑',
    running: '正在运行',
    ran: '已运行',
    searching: '正在搜索',
    searched: '已搜索',
    reading: '正在读取',
    read: '已读取',
    analyzing: '正在分析',
    analyzed: '已分析',
  };

  const STEP_NOUN_MAP = {
    file: '个文件',
    files: '个文件',
    folder: '个文件夹',
    folders: '个文件夹',
    directory: '个目录',
    directories: '个目录',
    search: '次搜索',
    searches: '次搜索',
    command: '个命令',
    commands: '个命令',
    task: '个任务',
    tasks: '个任务',
    page: '个页面',
    pages: '个页面',
    browser: '次浏览器操作',
    browsers: '次浏览器操作',
    image: '张图片',
    images: '张图片',
    action: '项操作',
    actions: '项操作',
    artifact: '个产物',
    artifacts: '个产物',
  };

  function translateStepGroupSummary(text) {
    const parts = text.split(/\s*,\s*/);
    const out = [];
    for (const part of parts) {
      const m = part.match(/^(?:(Exploring|Explored|Editing|Edited|Running|Ran|Searching|Searched|Reading|Read|Analyzing|Analyzed)\s+)?(\d+)\s+(files?|folders?|directories|directory|searches|search|commands?|tasks?|pages?|browsers?|images?|actions?|artifacts?)$/i);
      if (!m) return null;
      const verb = m[1] ? (STEP_VERB_MAP[m[1].toLowerCase()] || m[1]) + ' ' : '';
      const count = m[2];
      const noun = STEP_NOUN_MAP[m[3].toLowerCase()] || m[3];
      out.push(`${verb}${count} ${noun}`);
    }
    return out.length > 0 ? out.join('，') : null;
  }

  function translateCoreUnit(trimmed) {
    if (!trimmed) return null;
    if (translationCache.has(trimmed)) {
      return translationCache.get(trimmed);
    }

    // 1. Exact & normalized lookup
    if (exactMap.has(trimmed)) return cacheSet(trimmed, exactMap.get(trimmed));
    const n = norm(trimmed);
    if (!n) return cacheSet(trimmed, null);
    if (exactMap.has(n)) return cacheSet(trimmed, exactMap.get(n));
    if (translatedValuesSet.has(n)) return cacheSet(trimmed, null);

    // Quick exit if no English letters
    if (!/[A-Za-z]/.test(n)) return cacheSet(trimmed, null);

    // Case-insensitive lookup for multi-word UI strings or Capitalized labels
    const lower = n.toLowerCase();
    if (lowerMap.has(lower)) {
      if (n.includes(' ') || /^[A-Z]/.test(n)) {
        return cacheSet(trimmed, lowerMap.get(lower));
      }
    }

    // 2. Trailing colon / ellipsis / punctuation handling
    const puncMatch = n.match(/^([\w\s\-\/]+?)([:：…\.？\?!！]+)$/);
    if (puncMatch) {
      const base = puncMatch[1].trim();
      const punc = puncMatch[2];
      const baseTrans = exactMap.get(base) || (base.includes(' ') || /^[A-Z]/.test(base) ? lowerMap.get(base.toLowerCase()) : null);
      if (baseTrans) {
        return cacheSet(trimmed, baseTrans + (punc === ':' ? '：' : (punc === '...' ? '…' : punc)));
      }
    }

    // 3. Hotkey suffix handling: e.g. "Quote (Ctrl+L)" or "Command Palette (Cmd+Shift+P)"
    const hotkeyMatch = n.match(/^([\w\s\-\/]+?)\s*(\((?:Ctrl|Cmd|Alt|Shift|Opt|Option|Command|\u2318|\u2325|\u21e7|\u2303)[^\)]*\)|\b(?:Ctrl|Cmd|Alt|Shift)\+[\w;:,\\/+\-]+)$/i);
    if (hotkeyMatch) {
      const cmdBase = hotkeyMatch[1].trim();
      const hotkey = hotkeyMatch[2].trim();
      const cmdTrans = exactMap.get(cmdBase) || lowerMap.get(cmdBase.toLowerCase());
      if (cmdTrans) {
        return cacheSet(trimmed, `${cmdTrans} ${hotkey}`);
      }
    }

    // 4. Fast dynamic UI patterns
    let m;
    if ((m = n.match(/^(Thought|Thinking|Worked|Working) for\s+(.+)$/i))) {
      const verb = /^Thought/i.test(m[1]) ? '已思考' : (/^Thinking/i.test(m[1]) ? '正在思考' : (/^Worked/i.test(m[1]) ? '已工作' : '正在工作'));
      return cacheSet(trimmed, `${verb} ${formatCompactDuration(m[2])}`);
    }
    const stepSummary = translateStepGroupSummary(n);
    if (stepSummary) return cacheSet(trimmed, stepSummary);

    if ((m = n.match(/^No more older messages,\s*showing\s+(\d+)\s+of\s+(\d+)$/i))) {
      return cacheSet(trimmed, `没有更多历史消息，当前显示 ${m[1]} / ${m[2]} 条`);
    }
    if ((m = n.match(/^Showing\s+(\d+)\s+of\s+(\d+)\s+messages?$/i))) {
      return cacheSet(trimmed, `当前显示 ${m[1]} / ${m[2]} 条消息`);
    }
    if ((m = n.match(/^Refreshed\s+(.+?)\s+ago$/i))) {
      return cacheSet(trimmed, `${formatDuration(m[1])}前已刷新`);
    }
    if ((m = n.match(/^Updated\s+(.+?)\s+ago$/i))) {
      return cacheSet(trimmed, `${formatDuration(m[1])}前更新`);
    }

    // 5. 338 Cascading Regex Patterns (from yiheng8023 v2.26.0 suite)
    for (let i = 0; i < compiledPatterns.length; i++) {
      const p = compiledPatterns[i];
      if (p.regex.test(n)) {
        let res = n.replace(p.regex, p.replacement);
        for (let j = 0; j < compiledPatterns.length; j++) {
          if (compiledPatterns[j].regex.test(res)) {
            res = res.replace(compiledPatterns[j].regex, compiledPatterns[j].replacement);
          }
        }
        p.regex.lastIndex = 0;
        return cacheSet(trimmed, res);
      }
    }

    // 6. Full-sentence conservation multi-sentence splitter
    if (n.includes('. ') || n.includes('! ') || n.includes('? ')) {
      const sentences = n.split(/([.!?]\s+)/);
      let anyTranslated = false;
      let allTranslated = true;
      const parts = [];
      for (let i = 0; i < sentences.length; i++) {
        const part = sentences[i];
        const tPart = part.trim();
        if (!tPart || /^[.!?]+\s*$/.test(part)) {
          parts.push(part.replace(/\.\s*/g, '。'));
          continue;
        }
        const subTrans = exactMap.get(tPart) || exactMap.get(tPart + '.') || translateCoreUnit(tPart);
        if (subTrans && subTrans !== tPart) {
          anyTranslated = true;
          parts.push(subTrans);
        } else {
          allTranslated = false;
          break;
        }
      }
      if (anyTranslated && allTranslated) {
        return cacheSet(trimmed, parts.join('').replace(/([。！？])[。！？.]*\s*/g, '$1').trim());
      }
    }

    return cacheSet(trimmed, null);
  }

  function translateString(raw) {
    if (!raw || typeof raw !== 'string') return raw;
    const match = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!match) return raw;
    const [, leading, core, trailing] = match;
    if (!core) return raw;
    const translated = translateCoreUnit(core);
    if (translated !== null && translated !== core) {
      return leading + translated + trailing;
    }
    return raw;
  }

  // ========== 4. Native Context Menu & Cascading Submenu Interception (Zero-ASAR IPC Pre-Hook) ==========
  window.__antigravityContextMenuTranslate = function(lbl) {
    if (!lbl || typeof lbl !== 'string') return lbl;
    const tr = translateCoreUnit(lbl.trim());
    return tr || lbl;
  };

  if (!window.__antigravityOrigArrayMap) {
    window.__antigravityOrigArrayMap = Array.prototype.map;
    Array.prototype.map = function(fn, thisArg) {
      const res = window.__antigravityOrigArrayMap.call(this, fn, thisArg);
      try {
        if (
          res &&
          res.length > 0 &&
          res[0] &&
          typeof res[0] === 'object' &&
          'accelerator' in res[0] &&
          'label' in res[0]
        ) {
          const translator = window.__antigravityContextMenuTranslate;
          if (translator) {
            for (let i = 0; i < res.length; i++) {
              const item = res[i];
              if (item && typeof item.label === 'string' && item.label) {
                item.label = translator(item.label);
              }
            }
          }
        }
      } catch {}
      return res;
    };
  }

  // ========== 5. Ultra-Fast O(1) DOM Scanner with Negative Caching & Inline Self-Healing ==========
  const ATTRS = ['aria-label', 'title', 'placeholder', 'alt', 'data-tooltip', 'aria-description'];

  function getFirstDirectTextNode(n) {
    let cur = n;
    while (cur) {
      if (cur.nodeType === Node.TEXT_NODE) return cur;
      if (cur.nodeType === Node.ELEMENT_NODE && cur.childNodes.length === 1) {
        cur = cur.firstChild;
      } else {
        break;
      }
    }
    return null;
  }

  function translateTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const raw = node.nodeValue;
    if (!raw) return;

    // O(1) Negative & Positive Cache Short-Circuit!
    if (node._zhOrig === raw) return;

    if (shouldSkipText(node)) {
      node._zhOrig = raw;
      return;
    }

    const trimmed = raw.trim();
    if (!trimmed) {
      node._zhOrig = raw;
      return;
    }

    // Thinking duration suffix 's'
    if (trimmed === 's' && node.parentElement?.closest?.('[data-testid="thinking-collapsible-trigger"]')) {
      node.nodeValue = ' 秒';
      node._zhOrig = node.nodeValue;
      return;
    }

    // Trailing period after Chinese sibling link
    if (trimmed === '.' && node.previousSibling && /[\u4e00-\u9fa5]/.test(node.previousSibling.textContent || '')) {
      node.nodeValue = raw.replace('.', '。');
      node._zhOrig = node.nodeValue;
      return;
    }

    const translated = translateCoreUnit(trimmed);
    if (translated !== null && translated !== trimmed) {
      let leadingSpace = raw.match(/^\s*/)[0];
      const trailingSpace = raw.match(/\s*$/)[0];
      // Pangu spacing (盘古之白)
      if (!leadingSpace && node.previousSibling) {
        const prevText = (node.previousSibling.textContent || '').trim();
        if (/[a-zA-Z0-9]$/.test(prevText) && /^[\u4e00-\u9fa5]/.test(translated)) {
          leadingSpace = ' ';
        }
      }
      const nextVal = leadingSpace + translated + trailingSpace;
      node.nodeValue = nextVal;
      node._zhOrig = nextVal;
    } else {
      node._zhOrig = raw;
    }
  }

  function translateElementAttrsAndInline(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
    if (shouldSkipAttrs(el)) return;

    // 1. Attribute translation with O(1) negative cache per attribute
    for (let i = 0; i < ATTRS.length; i++) {
      const attr = ATTRS[i];
      if (el.hasAttribute?.(attr)) {
        const val = el.getAttribute(attr);
        if (!val) continue;
        const cacheProp = '_zhAttr_' + attr;
        if (el[cacheProp] === val) continue;
        const next = translateString(val);
        if (next !== val) {
          el.setAttribute(attr, next);
          el[cacheProp] = next;
        } else {
          el[cacheProp] = val;
        }
      }
    }

    // 2. Specific JSX fragmented Alert self-healing (plan-command-fyi-alert)
    if (el.getAttribute?.('data-testid') === 'plan-command-fyi-alert') {
      const alertSpan = el.querySelector?.('span');
      if (alertSpan && !alertSpan._zhAlertDone) {
        for (let c = alertSpan.firstChild; c; c = c.nextSibling) {
          if (c.nodeType === Node.TEXT_NODE && c.nodeValue?.trim() === 'Type') {
            c.nodeValue = c.nodeValue.replace('Type', '输入');
            c._zhOrig = c.nodeValue;
          }
        }
        alertSpan._zhAlertDone = true;
      }
    }

    // 3. Multi-TextNode coalescing & cross-inline word order self-healing ("Also includes <span>Global Permissions</span> when working in this project.")
    const first = el.firstChild;
    if (first && first.nextSibling && !shouldSkipText(el)) {
      let allText = true;
      for (let c = first; c; c = c.nextSibling) {
        if (c.nodeType !== Node.TEXT_NODE) {
          allText = false;
          break;
        }
      }
      if (allText) {
        const combined = el.textContent;
        if (combined && el._zhCombined !== combined) {
          const trans = translateCoreUnit(combined.trim());
          if (trans !== null && trans !== combined.trim()) {
            first.nodeValue = trans;
            first._zhOrig = trans;
            for (let other = first.nextSibling; other; other = other.nextSibling) {
              other.nodeValue = '';
              other._zhOrig = '';
            }
            el._zhCombined = trans;
          } else {
            el._zhCombined = combined;
          }
        }
      } else {
        let alsoNode = null;
        let whenNode = null;
        for (let scanCur = first; scanCur; scanCur = scanCur.nextSibling) {
          const tn = getFirstDirectTextNode(scanCur);
          if (tn && tn.nodeValue) {
            const tVal = tn.nodeValue.trim();
            if (/^(?:Also\s+includes|Includes|也包含|包含)$/i.test(tVal)) {
              alsoNode = tn;
            } else if (alsoNode && (tVal.includes('when working in this project') || tVal.includes('在此项目中工作时'))) {
              whenNode = tn;
              break;
            }
          }
        }
        if (alsoNode && whenNode) {
          const alsoText = alsoNode.nodeValue.trim();
          const prefix = (alsoText.includes('也') || /Also/i.test(alsoText)) ? '在此项目中工作时，也包含' : '在此项目中工作时包含';
          alsoNode.nodeValue = prefix;
          alsoNode._zhOrig = prefix;
          const cleanedWhen = whenNode.nodeValue
            .replace(/when\s+working\s+in\s+this\s+project[。.]?/gi, '')
            .replace(/在此项目中工作时[。.]?/g, '')
            .trim();
          whenNode.nodeValue = cleanedWhen ? ('。 ' + cleanedWhen) : '。';
          whenNode._zhOrig = whenNode.nodeValue;
        }
      }
    }
  }

  function translateSubtree(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }
    if (
      root.nodeType !== Node.ELEMENT_NODE &&
      root.nodeType !== Node.DOCUMENT_NODE &&
      root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE
    ) {
      return;
    }
    if (root.nodeType === Node.ELEMENT_NODE) {
      if (isEditableElement(root) || isModelSelectorBoundary(root)) return;
      translateElementAttrsAndInline(root);
      if (root.shadowRoot) translateSubtree(root.shadowRoot);
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.nodeType === Node.TEXT_NODE) {
        translateTextNode(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        translateElementAttrsAndInline(node);
        if (node.shadowRoot) translateSubtree(node.shadowRoot);
      }
    }
  }

  // ========== 6. rAF Batched Mutation Queue + Instant Hover Tooltip Interceptor ==========
  const pendingNodes = [];
  const pendingSet = new Set();
  let rafScheduled = false;

  function enqueueNode(node) {
    if (!node || pendingSet.has(node)) return;
    if (pendingNodes.length < 600) {
      pendingNodes.push(node);
      pendingSet.add(node);
    }
  }

  function flushPendingNodes() {
    rafScheduled = false;
    if (pendingNodes.length === 0) return;
    const batch = pendingNodes.splice(0, 250);
    for (let i = 0; i < batch.length; i++) {
      pendingSet.delete(batch[i]);
    }
    for (let i = 0; i < batch.length; i++) {
      try {
        translateSubtree(batch[i]);
      } catch {}
    }
    if (pendingNodes.length > 0) {
      scheduleFlush();
    }
  }

  function scheduleFlush() {
    if (!rafScheduled) {
      rafScheduled = true;
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(flushPendingNodes);
      } else {
        setTimeout(flushPendingNodes, 16);
      }
    }
  }

  function scanFloatingPortals() {
    if (!document.body) return;
    try {
      const portals = document.querySelectorAll(
        '[role="tooltip"], [role="menu"], [role="dialog"], [data-floating-ui-portal], [data-radix-popper-content-wrapper], .popover, .tooltip, .context-view, .monaco-hover'
      );
      for (let i = 0; i < portals.length; i++) {
        translateSubtree(portals[i]);
      }
    } catch {}
  }

  function run() {
    try {
      document.documentElement.lang = 'zh-CN';
    } catch {}

    try {
      translateSubtree(document);
    } catch (err) {
      console.warn('[antigravity-zh-patch v3.0] Initial scan error:', err);
    }

    try {
      if (window.__antigravityZhPatchObserver) {
        try { window.__antigravityZhPatchObserver.disconnect(); } catch {}
      }
      window.__antigravityZhPatchObserver = new MutationObserver((mutations) => {
        for (let i = 0; i < mutations.length; i++) {
          const mutation = mutations[i];
          if (mutation.type === 'characterData') {
            if (mutation.target) {
              mutation.target._zhOrig = undefined;
              enqueueNode(mutation.target);
            }
          } else if (mutation.type === 'attributes') {
            if (mutation.target && mutation.attributeName) {
              mutation.target['_zhAttr_' + mutation.attributeName] = undefined;
              translateElementAttrsAndInline(mutation.target);
            }
          } else if (mutation.type === 'childList') {
            const added = mutation.addedNodes;
            for (let j = 0; j < added.length; j++) {
              enqueueNode(added[j]);
            }
          }
        }
        if (pendingNodes.length > 0) {
          scheduleFlush();
        }
      });

      window.__antigravityZhPatchObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['aria-label', 'title', 'placeholder', 'alt', 'data-tooltip'],
      });
    } catch (err) {
      console.error('[antigravity-zh-patch v3.0] Failed to bind MutationObserver:', err);
    }

    // Hover & ContextMenu quick portal scanner (100ms throttled + 45ms debounced)
    try {
      let lastHover = 0;
      let hoverTimer = null;
      const onPointerOrMenu = (e) => {
        const now = Date.now();
        if (now - lastHover < 100) return;
        lastHover = now;
        const t = e.target;
        if (t && t.nodeType === Node.ELEMENT_NODE) {
          translateElementAttrsAndInline(t);
        }
        if (hoverTimer) clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
          hoverTimer = null;
          scanFloatingPortals();
        }, 45);
      };
      document.addEventListener('pointerenter', onPointerOrMenu, { capture: true, passive: true });
      document.addEventListener('contextmenu', onPointerOrMenu, { capture: true, passive: true });
      window.__antigravityHoverCleanup = () => {
        document.removeEventListener('pointerenter', onPointerOrMenu, { capture: true });
        document.removeEventListener('contextmenu', onPointerOrMenu, { capture: true });
      };
    } catch {}

    // Low-frequency 15s idle fallback scan
    window.__antigravityIdleInterval = setInterval(() => {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(() => translateSubtree(document), { timeout: 4000 });
      } else {
        translateSubtree(document);
      }
    }, 15000);
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', run, { once: true });
    setTimeout(run, 600);
  } else {
    run();
  }
})();