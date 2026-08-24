class Form {
  constructor({ fields, container }) {
    this.fields = fields;
    this.container = container;
    this.values = {};
    this.errors = {};
    this._init();
  }

  // 初始化内部状态并渲染
  _init() {
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
      }
    });
  }

  // 渲染表单
  render() {
    this.container.innerHTML = '';
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

    const label = document.createElement('label');
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

    // 错误信息容器
    const errorEl = document.createElement('div');
    errorEl.className = 'form-field__error';

    wrapper.appendChild(label);
    wrapper.appendChild(control);
    wrapper.appendChild(errorEl);

    // 设置宽度
    if (field.width) {
      wrapper.style.width = field.width;
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

    const options = field.options || [];
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

        // 选择后清除错误
        if (this.errors[field.name]) {
          this._clearError(wrapper, field.name);
        }

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
        requestAnimationFrame(scrollSelectedIntoView);
      });
    } else {
      // 点击切换展开/收起，并滚动到选中项
      trigger.addEventListener('click', () => {
        const isOpen = container.classList.toggle('select--open');
        if (isOpen) {
          requestAnimationFrame(scrollSelectedIntoView);
        }
      });
    }

    // 点击外部关闭
    document.addEventListener('click', (event) => {
      if (!container.contains(event.target)) {
        container.classList.remove('select--open');
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

    container.appendChild(trigger);
    container.appendChild(optionsContainer);
    return container;
  }

  /**
   * 格式化错误信息，支持模板变量替换
   */
  _formatMessage(template, field, rules) {
    if (typeof template !== 'string') return template;

    const vars = {
      label: field.label,
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
