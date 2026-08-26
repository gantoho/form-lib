// 内置默认图标（currentColor 着色，随 .form-field__icon 的 color 变化）
const DEFAULT_ICONS = {
  error: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="currentColor"/><line x1="5.5" y1="5.5" x2="10.5" y2="10.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><line x1="10.5" y1="5.5" x2="5.5" y2="10.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>',
  info: { src: 'https://www.puprime.com/wp-content/themes/puprime_new/images/live_detail_btn_pass.webp' },
  'password-on': { src: 'https://www.puprime.com/wp-content/themes/puprime_new/images/password_hide_btn.webp' },
  'password-off': { src: 'https://www.puprime.com/wp-content/themes/puprime_new/images/password_show_btn.webp' },
  clear: { src: 'https://www.puprime.com/wp-content/themes/puprime_new/images/phone_num_delete_new.png' },
  arrow: { src: 'https://www.puprime.com/wp-content/themes/puprime_new/images/live_arrow_down_country.webp' },
};

class Form {
  constructor({ fields, container, errorDisplay }) {
    this.fields = fields;
    this.container = container;
    this.errorDisplay = errorDisplay || 'auto'; // auto=默认隐藏; always=始终占位显示
    this.values = {};
    this.errors = {};
    this._init();
  }

  // 初始化内部状态并渲染
  _init() {
    // 支持 CSS 选择器字符串（如 '#app'、'.container'）
    if (typeof this.container === 'string') {
      this.container = document.querySelector(this.container);
    }
    this._initFields(this.fields);
    this.render();
  }

  // 递归初始化字段值
  _initFields(fields) {
    fields.forEach((field) => {
      if (field.type === 'group' && Array.isArray(field.fields)) {
        this._initFields(field.fields);
      } else {
        this.values[field.name] = field.value ?? '';
        // 规范化 rules：支持数组格式 [{ required, message }]
        if (Array.isArray(field.rules)) {
          field.rules = this._normalizeRules(field.rules);
        }
      }
    });
  }

  // 将数组格式 rules 转为对象格式
  _normalizeRules(rulesArr) {
    const rules = {};
    const message = {};
    rulesArr.forEach(rule => {
      if (rule.required !== undefined) { rules.required = rule.required; message.required = rule.message; }
      if (rule.minLength !== undefined) { rules.minLength = rule.minLength; message.minLength = rule.message; }
      if (rule.maxLength !== undefined) { rules.maxLength = rule.maxLength; message.maxLength = rule.message; }
      if (rule.pattern !== undefined) { rules.pattern = rule.pattern; message.pattern = rule.message; }
      if (rule.validator !== undefined) { rules.validator = rule.validator; message.validator = rule.message; }
      if (rule.min !== undefined) { rules.min = rule.min; message.min = rule.message; }
      if (rule.max !== undefined) { rules.max = rule.max; message.max = rule.message; }
    });
    if (Object.keys(message).length > 0) rules.message = message;
    return rules;
  }

  // 渲染表单
  render() {
    this.container.innerHTML = '';
    if (this.errorDisplay === 'always') {
      this.container.classList.add('form--error-display-always');
    } else {
      this.container.classList.remove('form--error-display-always');
    }
    this._renderFields(this.fields, this.container);
  }

  // 递归渲染字段
  _renderFields(fields, parentEl) {
    fields.forEach((field) => {
      if (field.type === 'group') {
        this._renderGroup(field, parentEl);
      } else {
        this._renderField(field, parentEl);
      }
    });
  }

  /**
   * 绑定验证事件
   * 支持的触发方式: blur(默认), input, submit
   */
  _bindValidation(control, field, wrapper) {
    const trigger = field.validateTrigger || 'blur';

    // 输入时清除错误（所有模式都支持）
    const onInput = (event) => {
      this.values[field.name] = event.target.value;
      if (this.errors[field.name]) {
        this._clearError(wrapper, field.name);
      }
    };

    // 验证函数
    const onValidate = () => {
      this._validateField(field, wrapper);
    };

    control.addEventListener('input', onInput);

    switch (trigger) {
      case 'input':
        // 输入时实时验证
        control.addEventListener('input', onValidate);
        break;
      case 'submit':
        // 仅在提交时验证，不绑定 blur
        break;
      case 'blur':
      default:
        // 失去焦点时验证
        control.addEventListener('blur', onValidate);
        break;
    }
  }

  // 渲染单个字段
  _renderField(field, parentEl) {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-field form-field--' + field.name;

    let label = null;
    if (field.label) {
      label = document.createElement('label');
      label.className = 'form-field__label';
      label.textContent = field.label;
      label.setAttribute('for', field.name);

      // 必填标记
      if (field.rules?.required) {
        const requiredMark = document.createElement('span');
        requiredMark.className = 'form-field__required';
        requiredMark.textContent = ' *';
        label.appendChild(requiredMark);
      }
    }

    let control;

    if (field.type === 'textarea') {
      control = document.createElement('textarea');
      control.className = 'form-field__textarea';
      control.name = field.name;
      control.id = field.name;
      control.value = this.values[field.name];
      control.placeholder = field.placeholder || '';
      this._bindValidation(control, field, wrapper);
    } else if (field.type === 'select') {
      control = this._createCustomSelect(field, wrapper);
    } else {
      // 默认 input
      control = document.createElement('input');
      control.className = 'form-field__input';
      control.type = field.type || 'text';
      control.name = field.name;
      control.id = field.name;
      control.autocomplete = 'off';
      control.value = this.values[field.name];
      control.placeholder = field.placeholder || '';
      this._bindValidation(control, field, wrapper);
    }

    // 控件容器：承载控件及右侧 icon 组，方便调整内部布局
    const controlWrap = document.createElement('div');
    controlWrap.className = 'form-field__control';
    controlWrap.appendChild(control);

    // 构建 icon 组
    this._buildIcons(field, controlWrap, control);

    // 错误信息容器
    const errorEl = document.createElement('div');
    errorEl.className = 'form-field__error';

    if (label) wrapper.appendChild(label);
    wrapper.appendChild(controlWrap);
    wrapper.appendChild(errorEl);

    // 设置宽度
    // 组内字段位于 flex 容器中，width 需转为 flex-basis 语义（不伸缩）
    // 才能让比例生效并覆盖通用 .form-group__fields .form-field { flex: 1 }
    if (field.width) {
      wrapper.style.width = field.width;
      wrapper.style.flex = 'auto';
    }

    parentEl.appendChild(wrapper);
  }

  // 渲染分组
  _renderGroup(group, parentEl) {
    const groupEl = document.createElement('div');
    groupEl.className = 'form-group';

    // 分组标签
    if (group.label) {
      const groupLabel = document.createElement('label');
      groupLabel.className = 'form-group__label';
      groupLabel.textContent = group.label;

      // 必填标记（如果分组内任意字段必填）
      const hasRequired = group.fields.some(f => f.rules?.required);
      if (hasRequired) {
        const requiredMark = document.createElement('span');
        requiredMark.className = 'form-field__required';
        requiredMark.textContent = ' *';
        groupLabel.appendChild(requiredMark);
      }

      groupEl.appendChild(groupLabel);
    }

    // 字段行容器
    const fieldsRow = document.createElement('div');
    fieldsRow.className = 'form-group__fields';

    // 渲染组内字段
    this._renderFields(group.fields, fieldsRow);

    groupEl.appendChild(fieldsRow);
    parentEl.appendChild(groupEl);
  }

  /**
   * 创建自定义下拉组件
   * 搜索模式下 select__trigger 直接作为 input，可在其上直接输入搜索
   */
  _createCustomSelect(field, wrapper) {
    const container = document.createElement('div');
    container.className = 'select';

    const rawOptions = field.options || [];
    // 支持字符串数组格式：将字符串转为 { label, value } 对象
    const options = rawOptions.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt);
    const currentValue = this.values[field.name];
    const selectedOption = options.find(opt => opt.value === currentValue);
    const isSearchable = Boolean(field.searchable);

    // 当前选中的标签（用于搜索后未选择时恢复状态）
    let selectedLabel = selectedOption ? selectedOption.label : '';

    // 触发器：搜索模式下为 input，非搜索模式为 div
    let trigger;
    if (isSearchable) {
      trigger = document.createElement('input');
      trigger.type = 'text';
      trigger.value = selectedLabel;
      trigger.placeholder = selectedLabel ? '' : (field.placeholder || '请选择');
      trigger.autocomplete = 'off';
    } else {
      trigger = document.createElement('div');
      trigger.textContent = selectedLabel || (field.placeholder || '请选择');
    }
    trigger.className = 'select__trigger';
    trigger.tabIndex = 0;
    trigger.id = field.name;

    // 选项列表容器
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'select__dropdown';

    // 重置过滤，显示全部选项；搜索模式下同时恢复之前的选中状态
    const resetFilter = () => {
      optionsContainer.querySelectorAll('.select__option').forEach(el => {
        el.style.display = '';
      });
      if (isSearchable) {
        trigger.value = selectedLabel;
        trigger.placeholder = selectedLabel ? '' : (field.placeholder || '请选择');
      }
    };

    // 将选中的选项滚动到可视区域垂直居中
    const scrollSelectedIntoView = () => {
      const selectedEl = optionsContainer.querySelector('.select__option--selected');
      if (selectedEl) {
        optionsContainer.scrollTop =
          selectedEl.offsetTop - optionsContainer.clientHeight / 2 + selectedEl.offsetHeight / 2;
      }
    };

    // 下拉宽度按所在行(组)计算：用于如区号下拉横跨整行
    // 普通 select 也需扩展到 control 宽度（icon 组占据右侧空间）
    const useRowWidth = field.dropdownWidth;
    const positionDropdown = () => {
      const selectRect = container.getBoundingClientRect();
      const control = wrapper.querySelector('.form-field__control');
      if (!control) return;
      const controlRect = control.getBoundingClientRect();

      if (useRowWidth) {
        const row = wrapper.closest('.form-group__fields');
        if (!row) return;
        const rowRect = row.getBoundingClientRect();
        const pct = parseFloat(field.dropdownWidth) / 100;
        optionsContainer.style.width = `${Math.round(rowRect.width * pct) - 2}px`;
        const offsetLeft = rowRect.left - selectRect.left;
        optionsContainer.style.left = `${offsetLeft}px`;
      } else {
        // 扩展下拉框到 control 宽度
        const offsetLeft = controlRect.left - selectRect.left;
        const offsetRight = selectRect.right - controlRect.right;
        optionsContainer.style.left = `${offsetLeft}px`;
        optionsContainer.style.right = `${offsetRight}px`;
      }
    };
    const resetDropdownPosition = () => {
      optionsContainer.style.left = '';
      optionsContainer.style.right = '';
      optionsContainer.style.top = '';
      optionsContainer.style.width = '';
    };

    // 创建选项
    const createOptionEl = (option) => {
      const optionEl = document.createElement('div');
      optionEl.className = 'select__option';
      optionEl.textContent = option.label;
      optionEl.dataset.value = option.value;

      if (option.value === currentValue) {
        optionEl.classList.add('select__option--selected');
      }

      optionEl.addEventListener('click', () => {
        this.values[field.name] = option.value;
        selectedLabel = option.label;

        if (isSearchable) {
          trigger.value = selectedLabel;
          trigger.placeholder = '';
        } else {
          trigger.textContent = selectedLabel;
        }

        optionsContainer.querySelectorAll('.select__option').forEach(el => {
          el.classList.remove('select__option--selected');
        });
        optionEl.classList.add('select__option--selected');

        container.classList.remove('select--open');
        resetDropdownPosition();

        // 选择后清除错误
        if (this.errors[field.name]) {
          this._clearError(wrapper, field.name);
        }

        // 刷新清空 icon 可见性
        if (container.__refreshClear) container.__refreshClear();

        // input 模式下选择后立即验证
        if ((field.validateTrigger || 'blur') === 'input') {
          this._validateField(field, wrapper);
        }
      });

      return optionEl;
    };

    options.forEach((option) => {
      optionsContainer.appendChild(createOptionEl(option));
    });

    if (isSearchable) {
      // 输入时过滤选项并自动展开
      trigger.addEventListener('input', () => {
        const keyword = trigger.value.toLowerCase().trim();
        const optionEls = optionsContainer.querySelectorAll('.select__option');

        optionEls.forEach((el) => {
          const label = el.textContent.toLowerCase();
          const value = (el.dataset.value || '').toLowerCase();
          if (label.includes(keyword) || value.includes(keyword)) {
            el.style.display = '';
          } else {
            el.style.display = 'none';
          }
        });

        if (!container.classList.contains('select--open')) {
          container.classList.add('select--open');
        }
      });

      // 聚焦时展开，待布局刷新后滚动选中项到可视区域居中
      trigger.addEventListener('focus', () => {
        container.classList.add('select--open');
        // dropdown 刚展开时为 display:none，需等帧后其尺寸/offset 才有效
        requestAnimationFrame(() => {
          positionDropdown();
          scrollSelectedIntoView();
        });
      });
    } else {
      // 点击切换展开/收起，并滚动到选中项
      trigger.addEventListener('click', () => {
        const isOpen = container.classList.toggle('select--open');
        if (isOpen) {
          requestAnimationFrame(() => {
            positionDropdown();
            scrollSelectedIntoView();
          });
        }
      });
    }

    // 点击外部关闭
    document.addEventListener('click', (event) => {
      if (!container.contains(event.target)) {
        container.classList.remove('select--open');
        resetDropdownPosition();
        resetFilter();
      }
    });

    // 失去焦点时验证（submit 模式下不验证）
    const triggerType = field.validateTrigger || 'blur';
    if (triggerType !== 'submit') {
      container.addEventListener('focusout', (event) => {
        if (!container.contains(event.relatedTarget)) {
          this._validateField(field, wrapper);
        }
      });
    }

    // 清空下拉选择（供清空 icon 调用）
    const clearSelection = () => {
      this.values[field.name] = '';
      selectedLabel = '';
      if (isSearchable) {
        resetFilter();
      } else {
        trigger.textContent = field.placeholder || '请选择';
      }
      optionsContainer.querySelectorAll('.select__option').forEach(el => {
        el.classList.remove('select__option--selected');
      });
      container.classList.remove('select--open');
      resetDropdownPosition();
      this._clearError(wrapper, field.name);
      if (container.__refreshClear) container.__refreshClear();
    };
    container.__clearSelect = clearSelection;

    container.appendChild(trigger);
    container.appendChild(optionsContainer);
    return container;
  }

  /**
   * 构建控件右侧的 icon 组
   * 支持：下拉箭头、错误图标、提示图标、密码显示/隐藏、清空
   */
  _buildIcons(field, controlWrap, control) {
    const icons = field.icons;
    const isSelect = control.classList && control.classList.contains('select');
    if (!icons && !isSelect) return;

    const iconsEl = document.createElement('div');
    iconsEl.className = 'form-field__icons';

    // 下拉箭头（自定义下拉专用）
    if (isSelect) {
      iconsEl.appendChild(this._makeIconEl('arrow', true));
    }

    if (icons) {
      // 错误图标：验证失败时通过 .form-field--error 显示
      if (icons.error) {
        iconsEl.appendChild(this._makeIconEl('error', icons.error));
      }

      // 提示图标 + tooltip
      if (icons.info) {
        const infoConf = typeof icons.info === 'object' ? icons.info : { text: icons.info };
        const infoEl = this._makeIconEl('info', infoConf.icon);
        if (infoConf.text) {
          const tooltipEl = document.createElement('div');
          tooltipEl.className = 'form-field__tooltip form-field__tooltip--' + (infoConf.tooltipPosition || 'top');
          tooltipEl.textContent = infoConf.text;
          const arrowEl = document.createElement('div');
          arrowEl.className = 'form-field__tooltip-arrow';
          tooltipEl.appendChild(arrowEl);
          // 自定义样式
          if (infoConf.tooltipStyle) {
            const ts = infoConf.tooltipStyle;
            const bgColor = ts.background || ts.backgroundColor;
            if (bgColor) {
              tooltipEl.style.setProperty('--tt-bg', bgColor);
            }
            Object.keys(ts).forEach(key => {
              if (key !== 'background' && key !== 'backgroundColor') {
                tooltipEl.style[key] = ts[key];
              }
            });
            // 记录用户设置的 max-width，供 compute 使用
            if (ts.maxWidth) {
              tooltipEl.dataset.userMaxWidth = ts.maxWidth;
            }
          }
          infoEl.appendChild(tooltipEl);
          this._bindTooltipAutoPosition(infoEl, tooltipEl, infoConf.tooltipPosition || 'top');
        }
        iconsEl.appendChild(infoEl);
      }

      // 密码显示/隐藏切换（仅密码输入框）
      const isPassword = control.type === 'password' || field.type === 'password';
      if (icons.passwordToggle && isPassword) {
        iconsEl.appendChild(this._makePasswordToggle(control));
      }

      // 清空按钮
      if (icons.clear) {
        iconsEl.appendChild(this._makeClearIcon(control, field));
      }
    }

    if (iconsEl.children.length > 0) {
      controlWrap.appendChild(iconsEl);
    }
  }

  /**
   * 解析 icon 配置为 HTML 字符串
   * 支持: true(默认图标) / svg 字符串 / { svg } / { src 或 image } 图片地址
   */
  _resolveIconHTML(conf, fallback) {
    // 统一处理：将任意格式的 icon 配置解析为 HTML 字符串
    const resolve = (val) => {
      if (typeof val === 'string') return val;                    // SVG 字符串
      if (val && typeof val === 'object') {
        if (val.svg) return val.svg;                              // { svg }
        if (val.src) return '<img src="' + val.src + '" alt="" />';   // { src }
        if (val.image) return '<img src="' + val.image + '" alt="" />'; // { image }
      }
      return null;
    };
    if (conf === true || conf == null) {
      return resolve(fallback) || fallback;
    }
    return resolve(conf) || resolve(fallback) || '';
  }

  /**
   * 创建单个 icon 元素
   */
  _makeIconEl(type, conf, fallback) {
    const el = document.createElement('span');
    el.className = 'form-field__icon form-field__icon--' + type;
    el.innerHTML = this._resolveIconHTML(conf, fallback || DEFAULT_ICONS[type]);
    return el;
  }

  /**
   * 密码显示/隐藏切换按钮
   */
  _makePasswordToggle(control) {
    const el = this._makeIconEl('toggle', true, DEFAULT_ICONS['password-on']);
    el.classList.add('form-field__icon--password-on');
    const render = () => {
      const show = control.type === 'text';
      el.innerHTML = show
        ? this._resolveIconHTML(DEFAULT_ICONS['password-on'])
        : this._resolveIconHTML(DEFAULT_ICONS['password-off']);
      el.classList.toggle('form-field__icon--password-off', !show);
    };
    render();
    el.addEventListener('click', () => {
      control.type = control.type === 'password' ? 'text' : 'password';
      render();
    });
    return el;
  }

  /**
   * 清空按钮：点击清空控件值；仅在有值时显示
   */
  _makeClearIcon(control, field) {
    const el = this._makeIconEl('clear', true);

    const hasValue = () => {
      const has = control.classList.contains('select')
        ? Boolean(this.values[field.name])
        : Boolean(control.value);
      el.style.display = has ? '' : 'none';
    };
    hasValue();

    const clear = () => {
      if (typeof control.__clearSelect === 'function') {
        control.__clearSelect();
      } else {
        control.value = '';
        control.dispatchEvent(new Event('input', { bubbles: true }));
      }
      hasValue();
    };
    el.addEventListener('click', clear);

    // 值变化时刷新可见性
    control.addEventListener('input', hasValue);
    // 供自定义下拉在选中/清空后刷新
    control.__refreshClear = hasValue;

    return el;
  }

  /**
   * tooltip 自动定位：渲染后立即计算最优方向，hover 只管显隐
   * @param {HTMLElement} infoEl - info 图标元素
   * @param {HTMLElement} tooltipEl - tooltip 气泡元素（真实 DOM）
   * @param {string} preferred - 首选方向
   */
  _bindTooltipAutoPosition(infoEl, tooltipEl, preferred) {
    const fallbackOrder = {
      top:    ['top', 'bottom', 'left', 'right'],
      bottom: ['bottom', 'top', 'left', 'right'],
      left:   ['left', 'right', 'top', 'bottom'],
      right:  ['right', 'left', 'top', 'bottom'],
    };

    const DIR_CLASS = 'form-field__tooltip--';

    const compute = () => {
      const directions = fallbackOrder[preferred] || fallbackOrder.top;
      const gap = 10;

      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const rect = infoEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;

      const userMW = tooltipEl.dataset.userMaxWidth;
      tooltipEl.style.maxWidth = userMW || '';
      const naturalW = tooltipEl.offsetWidth;
      const naturalH = tooltipEl.offsetHeight;

      const space = (dir) => {
        switch (dir) {
          case 'top':
            return { w: Math.min(cx - gap, vw - cx - gap) * 2, h: rect.top - gap };
          case 'bottom':
            return { w: Math.min(cx - gap, vw - cx - gap) * 2, h: vh - rect.bottom - gap };
          case 'left':
            return { w: rect.left - 10 - gap, h: vh };
          case 'right':
            return { w: vw - rect.right - 10 - gap, h: vh };
        }
      };

      let bestDir = preferred;
      let bestW = 0;

      // 后置修正：下一帧测量 tooltip 实际边界，超出时微调 transform
      const clampTooltip = () => {
        requestAnimationFrame(() => {
          const tipRect = tooltipEl.getBoundingClientRect();
          const curVw = document.documentElement.clientWidth;
          const curVh = document.documentElement.clientHeight;
          let tx = 0, ty = 0;

          if (bestDir === 'top' || bestDir === 'bottom') {
            if (tipRect.left < gap) tx = gap - tipRect.left;
            else if (tipRect.right > curVw - gap) tx = (curVw - gap) - tipRect.right;
          } else {
            if (tipRect.top < gap) ty = gap - tipRect.top;
            else if (tipRect.bottom > curVh - gap) ty = (curVh - gap) - tipRect.bottom;
            if (tipRect.left < gap) tx = gap - tipRect.left;
            else if (tipRect.right > curVw - gap) tx = (curVw - gap) - tipRect.right;
          }

          if (tx !== 0 || ty !== 0) {
            const baseX = (bestDir === 'top' || bestDir === 'bottom') ? '-50%' : '0';
            const baseY = (bestDir === 'left' || bestDir === 'right') ? '-50%' : '0';
            tooltipEl.style.transform = 'translate(calc(' + baseX + ' + ' + tx + 'px), calc(' + baseY + ' + ' + ty + 'px))';
          } else {
            tooltipEl.style.transform = '';
          }
        });
      };

      // 第一轮：自然宽度能放下则直接用
      for (const dir of directions) {
        const s = space(dir);
        const hOk = (dir === 'top' || dir === 'bottom') ? s.h > naturalH : true;
        if (naturalW <= s.w && hOk) {
          bestDir = dir;
          tooltipEl.style.maxWidth = userMW || '';
          tooltipEl.className = tooltipEl.className.replace(/form-field__tooltip--\w+/g, '') + ' ' + DIR_CLASS + dir;
          clampTooltip();
          return;
        }
      }

      // 第二轮：选空间最大的方向，约束宽度
      for (const dir of directions) {
        const s = space(dir);
        if (s.w > bestW) { bestW = s.w; bestDir = dir; }
      }
      // 动态获取 tooltip 的 padding + border 宽度
      const ttStyle = getComputedStyle(tooltipEl);
      const tooltipPadding = parseFloat(ttStyle.paddingLeft) + parseFloat(ttStyle.paddingRight);
      const tooltipBorder = parseFloat(ttStyle.borderLeftWidth) + parseFloat(ttStyle.borderRightWidth);
      // 额外预留箭头空间（约6px）
      const arrowSpace = 6;
      const maxFit = Math.max(Math.floor(bestW) - tooltipPadding - tooltipBorder - arrowSpace, 0);
      const finalMW = userMW
        ? Math.min(parseInt(userMW, 10) || maxFit, maxFit) + 'px'
        : maxFit + 'px';
      tooltipEl.style.maxWidth = finalMW;
      tooltipEl.className = tooltipEl.className.replace(/form-field__tooltip--\w+/g, '') + ' ' + DIR_CLASS + bestDir;
      clampTooltip();
    };

    // 存储 compute 供 resize 调用
    infoEl.__tooltipCompute = compute;

    // 延迟到下一帧计算（此时元素已插入 DOM）
    requestAnimationFrame(() => {
      requestAnimationFrame(compute);
    });

    // 窗口尺寸变化时重新计算所有 tooltip 方向
    if (!Form._tooltipResizeBound) {
      Form._tooltipResizeBound = true;
      window.addEventListener('resize', () => {
        document.querySelectorAll('.form-field__icon--info').forEach(el => {
          if (el.__tooltipCompute) el.__tooltipCompute();
        });
      });
    }
  }

  /**
   * 格式化错误信息，支持模板变量替换
   */
  _formatMessage(template, field, rules) {
    if (typeof template !== 'string') return template;

    const vars = {
      label: field.label || field.placeholder || field.name,
      value: this.values[field.name] ?? '',
      required: rules.required,
      minLength: rules.minLength,
      maxLength: rules.maxLength,
      pattern: rules.pattern,
    };

    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return vars[key] !== undefined ? vars[key] : match;
    });
  }

  /**
   * 验证单个字段
   */
  _validateField(field, wrapper) {
    const rules = field.rules;
    if (!rules) return true;

    const value = this.values[field.name];
    let errorMessage = '';
    const msg = rules.message;

    // 必填验证
    if (rules.required && (value === '' || value === null || value === undefined)) {
      const template = typeof msg === 'string' ? msg : msg?.required;
      errorMessage = this._formatMessage(template || '{label}不能为空', field, rules);
    }

    // 最小长度验证
    if (!errorMessage && rules.minLength !== undefined && value.length < rules.minLength) {
      const template = typeof msg === 'string' ? msg : msg?.minLength;
      errorMessage = this._formatMessage(template || '{label}长度不能少于{minLength}个字符', field, rules);
    }

    // 最大长度验证
    if (!errorMessage && rules.maxLength !== undefined && value.length > rules.maxLength) {
      const template = typeof msg === 'string' ? msg : msg?.maxLength;
      errorMessage = this._formatMessage(template || '{label}长度不能超过{maxLength}个字符', field, rules);
    }

    // select 类型：验证值是否在 options 中
    if (!errorMessage && field.type === 'select' && field.options && value) {
      const validOptions = field.options.map(opt => typeof opt === 'string' ? opt : opt.value);
      if (!validOptions.includes(value)) {
        const template = typeof msg === 'string' ? msg : msg?.options;
        errorMessage = this._formatMessage(template || '{label}的值不在可选范围内', field, rules);
      }
    }

    // 正则验证
    if (!errorMessage && rules.pattern && value) {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(value)) {
        const template = typeof msg === 'string' ? msg : msg?.pattern;
        errorMessage = this._formatMessage(template || '{label}格式不正确', field, rules);
      }
    }

    // 自定义验证函数
    if (!errorMessage && typeof rules.validator === 'function') {
      const result = rules.validator(value, this.values);
      if (result !== true && result) {
        errorMessage = this._formatMessage(result, field, rules);
      }
    }

    if (errorMessage) {
      this._showError(wrapper, field.name, errorMessage);
      return false;
    } else {
      this._clearError(wrapper, field.name);
      return true;
    }
  }

  /**
   * 显示错误信息
   */
  _showError(wrapper, fieldName, message) {
    this.errors[fieldName] = message;
    wrapper.classList.add('form-field--error');
    const errorEl = wrapper.querySelector('.form-field__error');
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  /**
   * 清除错误信息
   */
  _clearError(wrapper, fieldName) {
    delete this.errors[fieldName];
    wrapper.classList.remove('form-field--error');
    const errorEl = wrapper.querySelector('.form-field__error');
    if (errorEl) {
      errorEl.textContent = '';
    }
  }

  /**
   * 验证所有字段
   */
  validate() {
    this.errors = {};
    let isValid = true;

    this.fields.forEach((field) => {
      if (field.type === 'group') {
        field.fields.forEach((subField) => {
          const wrapper = this.container.querySelector('.form-field--' + subField.name);
          if (wrapper && !this._validateField(subField, wrapper)) {
            isValid = false;
          }
        });
      } else {
        const wrapper = this.container.querySelector('.form-field--' + field.name);
        if (wrapper && !this._validateField(field, wrapper)) {
          isValid = false;
        }
      }
    });

    return isValid;
  }

  /**
   * 验证指定字段
   */
  validateField(fieldName) {
    const field = this._findField(fieldName);
    if (!field) return true;

    const wrapper = this.container.querySelector('.form-field--' + fieldName);
    if (!wrapper) return true;

    return this._validateField(field, wrapper);
  }

  /**
   * 查找字段（支持分组内查找）
   */
  _findField(fieldName, fields = this.fields) {
    for (const field of fields) {
      if (field.name === fieldName) return field;
      if (field.type === 'group' && Array.isArray(field.fields)) {
        const found = this._findField(fieldName, field.fields);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * 获取所有错误信息
   */
  getErrors() {
    return { ...this.errors };
  }

  // 获取表单值
  getValues() {
    return { ...this.values };
  }

  // 设置表单值并重新渲染
  setValues(newValues) {
    Object.assign(this.values, newValues);
    this.render();
  }
}
