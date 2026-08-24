# Form 表单组件库

轻量、无依赖的 JavaScript 表单组件，采用 **BEM** 类名规范。支持字段分组、实时验证、可搜索下拉框、占位提示、自定义错误提示等能力。

- 纯原生 JS / CSS，无任何第三方依赖
- 内部类名遵循 `block__element--modifier` 的 BEM 风格
- 字段值双向同步，支持编程式读写

---

## 目录

- [快速开始](#快速开始)
- [Form 构造参数](#form-构造参数)
- [字段配置](#字段配置)
  - [type](#type)
  - [width — 字段宽度](#width--字段宽度)
  - [placeholder — 占位提示](#placeholder--占位提示)
  - [validateTrigger — 验证触发方式](#validatetrigger--验证触发方式)
  - [rules — 验证规则](#rules--验证规则)
  - [options — 下拉选项](#options--下拉选项)
  - [searchable — 可搜索下拉](#searchable--可搜索下拉)
  - [dropdownWidth — 下拉面板宽度](#dropdownwidth--下拉面板宽度)
- [字段分组 group](#字段分组-group)
- [错误提示与模板变量](#错误提示与模板变量)
- [errorDisplay — 错误显示模式](#errordisplay--错误显示模式)
- [实例方法](#实例方法)
- [样式与 BEM 类名](#样式与-bem-类名)

---

## 快速开始

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <link rel="stylesheet" href="lib/form.css" />
</head>
<body>
    <div id="app"></div>
    <script src="lib/form.js"></script>
    <script>
        const form = new Form({
            container: document.getElementById('app'),
            errorDisplay: 'auto',
            fields: [
                {
                    name: 'username',
                    label: '用户名',
                    type: 'text',
                    value: '',
                    placeholder: '请输入用户名',
                    validateTrigger: 'blur',
                    rules: {
                        required: true,
                        minLength: 3,
                        maxLength: 20,
                        message: {
                            required: '请输入{label}',
                            minLength: '{label}长度不能少于{minLength}个字符',
                        },
                    },
                },
            ],
        });

        if (form.validate()) {
            console.log(form.getValues());
        }
    </script>
</body>
</html>
```

---

## Form 构造参数

通过 `new Form(config)` 实例化，`config` 是一个对象，支持以下键：

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `container` | `HTMLElement` | **必填** | 表单渲染挂载的 DOM 节点 |
| `fields` | `Field[]` | **必填** | 字段配置数组，见下方 [字段配置](#字段配置) |
| `errorDisplay` | `string` | `'auto'` | 错误提示的显示模式，见 [errorDisplay](#errordisplay--错误显示模式) |

```javascript
const form = new Form({
    container: document.getElementById('app'),
    errorDisplay: 'auto',
    fields: [
        { name: 'username', label: '用户名', type: 'text' },
    ],
});
```

---

## 字段配置

数组 `fields` 中的每一项称为 **字段配置对象**。字段可以是普通字段，也可以是分组（`type: 'group'`），分组见 [字段分组 group](#字段分组-group)。

普通字段支持以下配置键：

| 属性 | 类型 | 默认值 | 适用范围 | 说明 |
|---|---|---|---|---|
| `name` | `string` | **必填** | 全部 | 字段唯一标识，也是表单值的 key；同时用于生成类名 `form-field--{name}` |
| `label` | `string` |  | 全部 | 字段标签文字 |
| `type` | `string` | `'text'` | 全部 | 字段控件类型，见 [type](#type) |
| `value` | `any` | `''` | 全部 | 初始值 |
| `placeholder` | `string` | `''` | text/password/textarea/select(搜索模式) | 占位提示文字，见 [placeholder](#placeholder--占位提示) |
| `width` | `string` |  | 全部 | 字段宽度，如 `'100%'`、`'35%'`，见 [width](#width--字段宽度) |
| `validateTrigger` | `string` | `'blur'` | 全部 | 验证触发方式，见 [validateTrigger](#validatetrigger--验证触发方式) |
| `rules` | `object` |  | 非 group | 验证规则，见 [rules](#rules--验证规则) |
| `options` | `array` | `[]` | select | 下拉选项数组，见 [options](#options--下拉选项) |
| `searchable` | `boolean` | `false` | select | 是否可搜索，见 [searchable](#searchable--可搜索下拉) |
| `dropdownWidth` | `string` |  | select(组内) | 下拉面板宽度相对所在组的百分比，见 [dropdownWidth](#dropdownwidth--下拉面板宽度) |

### type

| 值 | 渲染控件 | 说明 |
|---|---|---|
| `'text'` | `<input type="text">` | 单行文本框（默认） |
| `'password'` | `<input type="password">` | 密码框 |
| `'textarea'` | `<textarea>` | 多行文本域（可纵向拉伸 `resize: vertical`） |
| `'select'` | 自定义下拉 | 渲染为自定义下拉组件，需配合 `options` |
| `'group'` | 分组容器 | 用于字段同组同行布局，见 [字段分组 group](#字段分组-group) |

`type` 为除上述之外的任意值时，均按 `'text'` 处理。

### width — 字段宽度

控制字段在容器（尤其是分组行）中所占的宽度比例，值为 CSS 宽度字符串。

```javascript
{
    name: 'phone', label: '手机号', type: 'text',
    width: '65%',
}
```

**布局说明：**

- 分组内的字段位于 flex 容器（`.form-group__fields`，`display: flex`）中。
- 为避免 flex 布局忽略 `width`，组件内部会将设置了 `width` 的字段转为 `flex: auto`，使 `flex-basis` 采用 `width` 值，从而让比例生效。
- 未设置 `width` 的分组内字段默认 `flex: 1` 均分剩余空间。

```javascript
// 区号 + 手机号同组，按 35% / 65% 排列
{
    type: 'group',
    fields: [
        { name: 'phone_code', label: '区号', type: 'select', width: '35%', options: [...] },
        { name: 'phone', label: '手机号', type: 'text', width: '65%' },
    ],
}
```

### placeholder — 占位提示

为输入类控件与可搜索下拉设置占位提示文字。占位文字颜色统一为较淡的 `#999`，与正文 `#eeeeee` 区分。

```javascript
{
    name: 'username', label: '用户名', type: 'text',
    placeholder: '请输入用户名',
}
{
    name: 'bio', label: '个人简介', type: 'textarea',
    placeholder: '介绍一下自己...',
}
{
    name: 'role', label: '角色', type: 'select', searchable: true,
    placeholder: '搜索角色...',
}
```

> 对 searchable 的 select，`placeholder` 在「未选中任何选项」时显示为输入框占位。

### validateTrigger — 验证触发方式

控制验证在什么时机触发。

| 值 | 说明 |
|---|---|
| `'blur'` | 失去焦点时验证（默认） |
| `'input'` | 输入时实时验证 |
| `'submit'` | 仅在调用 `form.validate()` 时验证，不自动绑定 |

```javascript
{
    name: 'password', label: '密码', type: 'password',
    validateTrigger: 'input',   // 实时验证
}
```

**通用行为：**

- 无论哪种模式，一旦输入、错误已存在，会自动清除该字段的错误提示（`input` 事件时清除）。
- `input` 模式会额外在每次输入时执行验证。
- select 组件同样支持：`blur` 模式在失去焦点时验证；选择选项后若存在错误会自动清除；`input` 模式下选择选项后立即验证。

### rules — 验证规则

字段级验证配置。未配置 `rules`（或为 `undefined`）的字段不参与验证，始终视为通过。

```javascript
rules: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: '^[a-zA-Z0-9_]+$',
    validator: (value, values) => true | '错误信息',
    message: { /* 或字符串 */ },
}
```

| 规则 | 类型 | 说明 |
|---|---|---|
| `required` | `boolean` | 必填：值为空串 / `null` / `undefined` 时通过失败 |
| `minLength` | `number` | 最小长度：`value.length < minLength` 时通过失败 |
| `maxLength` | `number` | 最大长度：`value.length > maxLength` 时通过失败 |
| `pattern` | `string` | 正则表达式（字符串形式，内部 `new RegExp(pattern)`）。值为空时不参与；非空但匹配失败则报错 |
| `validator` | `function` | 自定义验证函数 `(value, values) => ...`。返回 `true` 表示通过；返回字符串则作为错误提示 |
| `message` | `object` / `string` | 错误提示文案，见 [错误提示与模板变量](#错误提示与模板变量) |

**校验顺序：** `required` → `minLength` → `maxLength` → `pattern` → `validator`，命中第一个错误即停止。

### options — 下拉选项

`select` 字段的下拉选项数组，每项为 `{ label, value }`：

```javascript
{
    name: 'role', label: '角色', type: 'select', value: '',
    options: [
        { label: '普通用户', value: 'user' },
        { label: '管理员', value: 'admin' },
        { label: '访客', value: 'guest' },
    ],
}
```

| 属性 | 说明 |
|---|---|
| `label` | 选项展示文本 |
| `value` | 选项的实际值，选中后写入 `form.values[name]` |

未配置 `options` 时下拉无选项。

### searchable — 可搜索下拉

配置 `searchable: true` 后，`select__trigger` 由 `div` 变为 `input`，可直接输入关键字对选项进行过滤。

```javascript
{
    name: 'role', label: '角色', type: 'select',
    searchable: true,
    placeholder: '搜索角色...',
    options: [ ... ],
}
```

**交互行为：**

- 触发框是一个 `input`，`value` 为当前选中项文本；未选中时显示 `placeholder`。
- 聚焦自动展开下拉；输入关键字实时过滤（同时匹配 `label` 与 `value`），并自动展开。
- 选中选项后触发框显示选项文本并关闭下拉，过滤重置。
- 输入搜索后**未选择**任何选项、失去焦点时，触发框自动**恢复为之前选中的选项**（未选中则恢复占位）。
- 展开下拉时，当前选中项会自动滚动到可视区域垂直居中。
- 点击下拉外部关闭并重置过滤。

### dropdownWidth — 下拉面板宽度

仅对 select 有效。控制下拉面板宽度相对**所在表单组（整行）**的百分比，而不是相对 select 自身。常配合分组使用，例如让较窄的「区号」字段的下拉横跨整行展开。

```javascript
{
    name: 'phone_code', label: '区号', type: 'select',
    width: '35%',
    dropdownWidth: '100%',   // 下拉面板宽度 = 整个表单组的 100%
    options: [ ... ],
}
```

- 值为百分比字符串，如 `'100%'`、`'150%'`。
- 组件会测量最近的 `.form-group__fields`（所在分组行）宽度，按下拉面板宽度设为 `行宽 × 百分比`。
- 若所在元素不在分组行内、或未配置该键，则下拉宽度默认与 select 本身等宽。
- 下拉关闭（点击外部或选择后）时会复位为默认尺寸。

---

## icons — 图标组

每个字段可通过 `icons` 配置其控件（输入框 / 文本域 / 下拉）**右侧的图标组**。控件外部包裹了容器 `.form-field__control`，图标组 `.form-field__icons` 绝对定位在其内部右端，方便统一调整布局。

```javascript
{
    name: 'username', label: '用户名', type: 'text',
    icons: {
        error: true,                 // 验证失败时显示错误图标
        info: '只能包含字母、数字和下划线', // 提示图标 + hover 提示文字
        clear: true,                 // 一键清空（仅在有值时显示）
    },
}
```

| 键 | 类型 | 说明 |
|---|---|---|
| `error` | `boolean` 或图标配置 | 验证失败时显示红色错误图标，配合 `.form-field--error` 自动显隐 |
| `info` | `string` 或 `{ icon, text }` | 提示图标；`string` 形式即提示文字，`{ icon: 图标配置, text: 'hover 提示' }` 可自定义图标与文字 |
| `passwordToggle` | `boolean` | 仅对 `type: 'password'` 生效，显示/隐藏密码切换眼睛图标 |
| `clear` | `boolean` | 一键清空；仅在字段有值时显示，值变化时自动显隐 |

**控件专有图标（无需配置，自动出现）：**

- 自定义下拉（`type: 'select'`）在触发器右侧自动显示下拉箭头 `.form-field__icon--arrow`。

**图标配置格式（`error` 设为对象、或 `info.icon`）支持：**

```javascript
// 1）使用内置默认（传 true 或不配图标即用默认）
icon: true

// 2）直接传 svg 字符串
icon: '<svg viewBox="0 0 16 16"><path d="..."/></svg>'

// 3）svg 字段
icon: { svg: '<svg>...</svg>' }

// 4）图片地址资源
icon: { src: 'https://example.com/icon.png' }   // 或 image: 'url'
```

**布局细节：**

- 图标组在控件右侧垂直居中；控件会根据图标数量自动预留右侧内边距（`.form-field__control--icons-1/2/3` → `padding-right: 34/52/70px`），避免文字与图标重叠。
- 错误图标默认隐藏，字段进入 `.form-field--error` 状态（验证失败）时显示。
- 提示图标 hover 时展示 `data-tooltip` 文本气泡（CSS `::after`）。
- 密码切换、清空图标带点击反馈（`cursor: pointer`）；错误、箭头、提示图标为只读。
- 清空对 input/textarea/搜索模式下拉直接清空；对非搜索模式的自定义下拉会复位选中状态。

---

## 字段分组 group

`type: 'group'` 用于把多个字段放在同一行（flex 横向排列）。

```javascript
{
    type: 'group',
    label: '联系方式',          // 可选，分组标签
    fields: [                   // 必填，组内字段数组
        { name: 'phone_code', label: '区号', type: 'select', width: '35%', options: [...] },
        { name: 'phone', label: '手机号', type: 'text', width: '65%' },
    ],
}
```

| 属性 | 类型 | 说明 |
|---|---|---|
| `type` | `string` | 固定为 `'group'` |
| `label` | `string` | 可选，分组标签 |
| `fields` | `Field[]` | 组内字段数组，可递归包含 `group`（支持嵌套） |

**行为细节：**

- 组内字段渲染在 `.form-group__fields`（`display: flex; gap`）中，默认横向排列。
- 若组内任一字段 `rules.required` 为真，分组标签会自动追加必填星号。
- 组内字段完整支持验证、验证触发方式、placeholder 等所有能力。
- 调用 `form.validate()` 时会对组内字段逐一验证。
- 支持嵌套分组（组内再嵌套 `group`）。

---

## 错误提示与模板变量

错误提示文案通过 `rules.message` 配置，支持模板变量自动替换，避免重复书写具体的数值。

**`message` 的两种形式：**

1. **对象形式**（推荐多规则时）：

```javascript
rules: {
    required: true,
    minLength: 3,
    maxLength: 20,
    message: {
        required: '请输入{label}',
        minLength: '{label}长度不能少于{minLength}个字符',
        maxLength: '{label}长度不能超过{maxLength}个字符',
    },
}
```

2. **字符串形式**（单规则时，所有规则的未匹配分支共用该文案）：

```javascript
rules: {
    maxLength: 200,
    message: '{label}长度不能超过{maxLength}个字符',
}
```

**未配置对应 message 时的内置默认文案：**

| 规则 | 默认文案 |
|---|---|
| `required` | `{label}不能为空` |
| `minLength` | `{label}长度不能少于{minLength}个字符` |
| `maxLength` | `{label}长度不能超过{maxLength}个字符` |
| `pattern` | `{label}格式不正确` |
| `validator` | 使用验证函数返回的字符串（无默认文案） |

**支持的模板变量：**

| 变量 | 说明 |
|---|---|
| `{label}` | 字段标签（`field.label`） |
| `{value}` | 字段当前输入值 |
| `{required}` | `required` 规则值 |
| `{minLength}` | `minLength` 规则值 |
| `{maxLength}` | `maxLength` 规则值 |
| `{pattern}` | `pattern` 规则值 |

> 通过 `{minLength}`、`{maxLength}` 等即可引用对应规则值，无需把数值重复写进文案。例如 `'{label}长度不能超过{maxLength}个字符'` 在 `maxLength: 200` 时渲染为「个人简介长度不能超过200个字符」。

---

## errorDisplay — 错误显示模式

控制 `.form-field__error`（错误提示元素）的显示方式，通过 `new Form` 的 `errorDisplay` 选项配置。

| 值 | 行为 |
|---|---|
| `'auto'`（默认） | 错误提示元素默认隐藏，验证失败时才显示；不影响布局 |
| `'always'` | 错误提示元素**始终占位显示**（预留一行高度），避免出现/消失时引起布局上下跳动；有错误时填充文案 |

```javascript
const form = new Form({
    container: document.getElementById('app'),
    errorDisplay: 'always',   // 始终预留错误提示空间
    fields: [ ... ],
});
```

---

## 实例方法

创建 `const form = new Form(config)` 后可调用以下方法：

| 方法 | 返回值 | 说明 |
|---|---|---|
| `validate()` | `boolean` | 验证所有字段（含分组内字段），返回是否全部通过 |
| `validateField(fieldName)` | `boolean` | 验证指定字段（支持分组内字段，通过 `name` 查找） |
| `getErrors()` | `object` | 返回当前错误信息对象拷贝 `{ fieldName: message }` |
| `getValues()` | `object` | 返回表单全部值拷贝 `{ fieldName: value }` |
| `setValues(newValues)` | — | 合并设置若干字段值并重新渲染表单 |

```javascript
form.validate();                 // true / false
form.validateField('username');  // true / false
form.getErrors();                // { username: '用户名不能为空' }
form.getValues();                // { username: 'admin', role: 'user' }
form.setValues({ username: 'admin', role: 'admin' });
```

---

## 样式与 BEM 类名

样式集中在 `lib/form.css`，内部类名遵循 BEM 规范（`block__element--modifier`），可通过覆盖这些类名自定义主题。

### Block 与类名总览

| 类名 | 类型 | 说明 |
|---|---|---|
| `.form-field` | Block | 字段容器 |
| `.form-field__label` | Element | 字段标签 |
| `.form-field__input` | Element | 单行文本框 / 密码框 |
| `.form-field__textarea` | Element | 文本域 |
| `.form-field__required` | Element | 必填星号（红色 `*`） |
| `.form-field__error` | Element | 错误提示容器（默认隐藏，有错误时显示） |
| `.form-field--{name}` | Modifier | 按字段 `name` 区分的容器标识 |
| `.form-field--error` | Modifier | 字段错误状态（红色边框 + 显示错误文案） |
| `.select` | Block | 下拉框容器 |
| `.select__trigger` | Element | 触发框（非搜索为 `div`，搜索模式为 `input`） |
| `.select__dropdown` | Element | 下拉面板（绝对定位） |
| `.select__option` | Element | 单个选项 |
| `.select__option--selected` | Modifier | 选中状态（高亮文字色） |
| `.select--open` | Modifier | 展开状态（显示下拉面板） |
| `.form-group` | Block | 分组容器 |
| `.form-group__label` | Element | 分组标签 |
| `.form-group__fields` | Element | 分组字段行（flex 容器） |
| `.form--error-display-always` | Modifier | 容器级修饰符，`errorDisplay: 'always'` 时追加 |
| `.form-field__control` | Element | 控件容器（包裹控件与 icon 组，`position: relative`） |
| `.form-field__icons` | Element | 图标组容器（绝对定位在控件右侧） |
| `.form-field__icon` | Element | 单个图标 |
| `.form-field__icon--error` | Element | 错误图标（验证失败时显示） |
| `.form-field__icon--info` | Element | 提示图标（hover 显示 tooltip） |
| `.form-field__icon--toggle` / `--password-on` / `--password-off` | Element | 密码显示/隐藏切换图标 |
| `.form-field__icon--clear` | Element | 清空图标（仅在有值时显示） |
| `.form-field__icon--arrow` | Element | 下拉箭头（select 自动追加） |
| `.form-field__control--icons-{n}` | Modifier | 图标数量为 n 时，控件预留对应右侧内边距 |

### 错误样式

- `.form-field--error .form-field__input / __textarea / .select__trigger`：错误状态下边框变红。
- 焦点时 `.form-field--error` 下 outline 变红。
- 必填星号 `.form-field__required`：`#ff4d4f`。

### 布局要点

- `.select__dropdown`：`position: absolute`，相对 `.select` 定位，展开时 `display: block`。
- 分组内字段默认 `flex: 1` 均分；设置 `width` 后转为 `flex: auto`（basis 采用 width）。
- 三种控件（div trigger、input trigger、普通 input/textarea）已统一 `font-family: inherit`、`line-height: 1.5`、`box-sizing: border-box`、`padding: 8px 12px`、`border: 1px`，保证高度一致。
```