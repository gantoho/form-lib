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
      control.addEventListener('input', (event) => {
        this.values[field.name] = event.target.value;
        if (this.errors[field.name]) {
          this._clearError(wrapper, field.name);
        }
      });
      control.addEventListener('blur', () => {
        this._validateField(field, wrapper);
      });
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
      control.addEventListener('input', (event) => {
        this.values[field.name] = event.target.value;
        if (this.errors[field.name]) {
          this._clearError(wrapper, field.name);
        }
      });
      control.addEventListener('blur', () => {
        this._validateField(field, wrapper);
      });
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
   */
  _createCustomSelect(field, wrapper) {
    const container = document.createElement('div');
    container.className = 'select';

    // 触发器
    const trigger = document.createElement('div');
    trigger.className = 'select__trigger';
    trigger.tabIndex = 0;
    trigger.id = field.name; // 方便 label 关联

    // 选项列表容器
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'select__dropdown';

    const options = field.options || [];
    const currentValue = this.values[field.name];
    const selectedOption = options.find(opt => opt.value === currentValue);
    trigger.textContent = selectedOption ? selectedOption.label : '请选择';

    // 创建选项
    options.forEach((option) => {
      const optionEl = document.createElement('div');
      optionEl.className = 'select__option';
      optionEl.textContent = option.label;
      optionEl.dataset.value = option.value;

      if (option.value === currentValue) {
        optionEl.classList.add('select__option--selected');
      }

      optionEl.addEventListener('click', () => {
        this.values[field.name] = option.value;
        trigger.textContent = option.label;

        optionsContainer.querySelectorAll('.select__option').forEach(el => {
          el.classList.remove('select__option--selected');
        });
        optionEl.classList.add('select__option--selected');

        container.classList.remove('select--open');

        // 选择后清除错误
        if (this.errors[field.name]) {
          this._clearError(wrapper, field.name);
        }
      });

      optionsContainer.appendChild(optionEl);
    });

    // 点击触发器切换选项列表
    trigger.addEventListener('click', () => {
      const isOpen = container.classList.toggle('select--open');
      if (isOpen) {
        const selectedEl = optionsContainer.querySelector('.select__option--selected');
        // selectedEl?.scrollIntoView({ block: 'center' });
        if (selectedEl) {
          optionsContainer.scrollTop =
            selectedEl.offsetTop - optionsContainer.clientHeight / 2 + selectedEl.offsetHeight / 2;
        }
      }
    });

    // 点击外部关闭
    document.addEventListener('click', (event) => {
      if (!container.contains(event.target)) {
        container.classList.remove('select--open');
      }
    });

    // 失去焦点时验证
    container.addEventListener('focusout', (event) => {
      if (!container.contains(event.relatedTarget)) {
        this._validateField(field, wrapper);
      }
    });

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
        // 验证分组内的字段
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
    // 在所有字段中查找（包括分组内的字段）
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
